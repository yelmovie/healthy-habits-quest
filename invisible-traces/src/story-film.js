// 인트로·파이널 이야기 영상(약 25초). 전체 화면(contain), 자막은 영상 안에 들어 있다.
// 학습 기록·진행에는 손대지 않고, 닫히면 onClose 로 원래 흐름을 잇는다. 영상이 안 열려도 「계속하기」로 넘어간다.
export function openStoryFilm(doc, {src, poster, label, muted = false, autoplay = true, onClose, onCertificate}) {
 if (doc.querySelector('.story-film-dialog')) return false;
 const dialog = doc.createElement('dialog'); dialog.className = 'story-film-dialog'; dialog.setAttribute('aria-label', label);
 Object.assign(dialog.style, {position: 'fixed', inset: '0', width: '100dvw', height: '100dvh', maxWidth: 'none', maxHeight: 'none', margin: '0', padding: '0', border: '0', background: '#000', zIndex: '999', overflow: 'hidden'});
 const video = doc.createElement('video'); video.src = src; if (poster) video.poster = poster;
 video.playsInline = true; video.controls = false; video.muted = muted; video.preload = 'auto'; video.setAttribute('aria-label', label);
 Object.assign(video.style, {display: 'block', width: '100%', height: '100%', objectFit: 'contain', background: '#000', cursor: 'pointer'});
 const skip = doc.createElement('button'); skip.type = 'button'; skip.className = 'btn primary story-film-skip'; skip.textContent = '건너뛰기';
 Object.assign(skip.style, {position: 'absolute', top: 'max(14px, env(safe-area-inset-top, 0px))', right: 'max(14px, env(safe-area-inset-right, 0px))', minHeight: '48px', minWidth: '48px', padding: '6px 20px', opacity: '.92'});
 const status = doc.createElement('p'); status.hidden = true; status.setAttribute('role', 'status');
 Object.assign(status.style, {position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: '0', padding: '14px 18px', borderRadius: '12px', background: 'rgba(16,62,67,.92)', color: '#fff', textAlign: 'center'});
 dialog.append(video, skip, status); doc.body.append(dialog); dialog.showModal(); skip.focus({preventScroll: true});
 let done = false;
 const finish = () => { if (done) return; done = true; video.pause(); dialog.remove(); onClose?.(); };
 skip.addEventListener('click', () => dialog.close());
 // 파이널 영상이 떠 있어도 인증서를 한 번 눌러 열 수 있다. 먼저 영상 정리를 끝낸 뒤 이동한다.
 if (onCertificate) {
  const certificate = doc.createElement('button'); certificate.type = 'button'; certificate.className = 'btn primary story-film-certificate'; certificate.textContent = '조사 인증서';
  Object.assign(certificate.style, {position: 'absolute', bottom: 'max(18px, env(safe-area-inset-bottom, 0px))', right: 'max(14px, env(safe-area-inset-right, 0px))', minWidth: '48px', minHeight: '48px', padding: '8px 20px'});
  certificate.addEventListener('click', () => { finish(); onCertificate(); }); dialog.append(certificate);
 }
 // 영상을 누르면 멈춤·이어 보기(아래 자막 자리를 덮는 조작 막대는 두지 않는다)
 video.addEventListener('click', () => { if (video.paused) video.play().catch(() => {}); else video.pause(); });
 video.addEventListener('ended', () => { skip.textContent = '계속하기'; skip.focus(); });
 video.addEventListener('error', () => { status.hidden = false; status.textContent = '지금은 영상을 열 수 없어. 「계속하기」를 눌러 이어 가자.'; skip.textContent = '계속하기'; });
 dialog.addEventListener('close', finish, {once: true});
 video.addEventListener('play', () => { if (status.dataset.hint) { status.hidden = true; delete status.dataset.hint; } });
 if (autoplay) video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
 else { status.hidden = false; status.dataset.hint = '1'; status.textContent = '화면을 누르면 영상이 재생돼.'; status.style.pointerEvents = 'none'; }
 return true;
}
