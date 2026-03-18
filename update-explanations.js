const fs = require('fs');
const path = require('path');

const baseDir = '/mnt/c/Users/aksnr/projects/baker-quiz';
const comcbtFile = path.join(baseDir, 'data', 'comcbt-explanations.json');
const indexFile = path.join(baseDir, 'index.html');

// 텍스트 정규화: 공백/특수문자 차이 무시
function normalize(text) {
  return text
    .replace(/\s+/g, '')
    .replace(/[.,!?;:·~\-–—()（）\[\]「」『』""'']/g, '')
    .replace(/℃/g, '도')
    .toLowerCase();
}

// 유사도 계산 (정규화된 문자열 기준)
function similarity(a, b) {
  if (!a || !b) return 0;
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  // 짧은 쪽 기준 공통 접두사 비율
  const minLen = Math.min(na.length, nb.length);
  let match = 0;
  for (let i = 0; i < minLen; i++) {
    if (na[i] === nb[i]) match++;
    else break;
  }
  return match / Math.max(na.length, nb.length);
}

function main() {
  // 1. comcbt 데이터 로드
  if (!fs.existsSync(comcbtFile)) {
    console.error('comcbt 데이터 없음:', comcbtFile);
    process.exit(1);
  }

  const comcbtData = JSON.parse(fs.readFileSync(comcbtFile, 'utf8'));

  // 2. comcbt 해설 룩업 빌드: normalized question text → { explanation, answer, original }
  const comcbtLookup = new Map();
  let totalComcbt = 0;
  let withExplanation = 0;

  for (const exam of comcbtData) {
    for (const q of exam.questions) {
      if (!q.q) continue;
      totalComcbt++;
      const key = normalize(q.q);
      if (q.e) {
        withExplanation++;
        comcbtLookup.set(key, {
          e: q.e,
          a: q.a,
          originalQ: q.q,
          examId: exam.id,
          qNum: q.num
        });
      }
    }
  }

  console.log(`comcbt 데이터: ${totalComcbt}문제, 해설 있음: ${withExplanation}`);
  console.log(`룩업 키 수: ${comcbtLookup.size}`);

  // 3. index.html 로드
  let html = fs.readFileSync(indexFile, 'utf8');
  html = html.replace(/\r\n/g, '\n');

  // 4. 문제별 매칭 및 해설 교체
  // 패턴: {q:"...",o:[...],a:N,e:"...",r:NN,c:"..."}
  const qPattern = /\{q:((?:"(?:[^"\\]|\\.)*")),o:\[((?:"(?:[^"\\]|\\.)*",?)+)\],a:(\d+),e:(?:"(?:[^"\\]|\\.)*"),r:(\d+),c:((?:"(?:[^"\\]|\\.)*"))\}/g;

  let matched = 0;
  let replaced = 0;
  let answerMismatch = 0;
  let noExplanation = 0;
  let totalQ = 0;
  const mismatches = [];

  html = html.replace(qPattern, (match, qStr, oStr, aStr, rStr, cStr) => {
    totalQ++;
    const qText = JSON.parse(qStr);
    const key = normalize(qText);
    const currentAnswer = parseInt(aStr);
    const currentR = parseInt(rStr);

    const comcbt = comcbtLookup.get(key);

    if (!comcbt) {
      // 정확 매칭 실패 → 부분 매칭 시도 (처음 20자)
      const shortKey = key.substring(0, 20);
      let bestMatch = null;
      let bestSim = 0;

      for (const [k, v] of comcbtLookup) {
        if (k.startsWith(shortKey)) {
          const sim = similarity(qText, v.originalQ);
          if (sim > bestSim) {
            bestSim = sim;
            bestMatch = v;
          }
        }
      }

      if (bestMatch && bestSim >= 0.8) {
        matched++;
        if (bestMatch.a !== currentAnswer) {
          answerMismatch++;
          mismatches.push({
            q: qText.substring(0, 40),
            indexA: currentAnswer,
            comcbtA: bestMatch.a,
            examId: bestMatch.examId,
            qNum: bestMatch.qNum
          });
          return match; // 정답 불일치 → 교체하지 않음
        }
        replaced++;
        const eStr = JSON.stringify(bestMatch.e);
        return `{q:${qStr},o:[${oStr}],a:${aStr},e:${eStr},r:99,c:${cStr}}`;
      }

      return match; // 매칭 실패 → 기존 유지
    }

    matched++;

    // 정답 일치 확인
    if (comcbt.a !== currentAnswer) {
      answerMismatch++;
      mismatches.push({
        q: qText.substring(0, 40),
        indexA: currentAnswer,
        comcbtA: comcbt.a,
        examId: comcbt.examId,
        qNum: comcbt.qNum
      });
      return match; // 정답 불일치 → 교체하지 않음 (안전)
    }

    if (!comcbt.e) {
      noExplanation++;
      return match; // comcbt에 해설 없음 → 기존 유지
    }

    replaced++;
    const eStr = JSON.stringify(comcbt.e);
    return `{q:${qStr},o:[${oStr}],a:${aStr},e:${eStr},r:99,c:${cStr}}`;
  });

  // 5. 저장
  fs.writeFileSync(indexFile, html, 'utf8');

  // 6. 검증
  const finalHtml = fs.readFileSync(indexFile, 'utf8');
  const r99Count = (finalHtml.match(/,r:99,/g) || []).length;
  const totalQCount = (finalHtml.match(/\{q:/g) || []).length;
  const fileSize = fs.statSync(indexFile).size;

  // JS 문법 검증
  const m = finalHtml.match(/<script>([\s\S]*)<\/script>/);
  let syntaxOk = false;
  try { new Function(m[1]); syntaxOk = true; } catch(e) { console.error('JS 문법 에러:', e.message); }

  console.log('\n=== 교체 결과 ===');
  console.log(`전체 문제: ${totalQ}`);
  console.log(`매칭 성공: ${matched} (${(matched/totalQ*100).toFixed(1)}%)`);
  console.log(`해설 교체: ${replaced} (r:99로 업데이트)`);
  console.log(`정답 불일치: ${answerMismatch} (교체 건너뜀)`);
  console.log(`comcbt 해설 없음: ${noExplanation}`);
  console.log(`\n최종 r:99 문제: ${r99Count}/${totalQCount}`);
  console.log(`파일 크기: ${(fileSize / 1024).toFixed(1)} KB`);
  console.log(`JS 문법: ${syntaxOk ? 'OK' : 'ERROR'}`);

  if (mismatches.length > 0) {
    console.log(`\n=== 정답 불일치 목록 (${mismatches.length}건) ===`);
    for (const m of mismatches.slice(0, 20)) {
      console.log(`  [${m.examId}/${m.qNum}] "${m.q}..." index:${m.indexA} vs comcbt:${m.comcbtA}`);
    }
    if (mismatches.length > 20) {
      console.log(`  ... 외 ${mismatches.length - 20}건`);
    }
  }

  // 리포트 저장
  const report = {
    date: new Date().toISOString(),
    total: totalQ,
    matched,
    replaced,
    answerMismatch,
    noExplanation,
    r99Count,
    totalQCount,
    syntaxOk,
    mismatches
  };
  fs.writeFileSync(path.join(baseDir, 'data', 'update-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('\n리포트 저장: data/update-report.json');
}

main();
