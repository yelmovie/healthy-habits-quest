// 인트로·아웃트로 이야기 영상(약 24초). 학습 기록·진행에는 손대지 않고, 닫히면 onClose 로 원래 흐름을 잇는다.
export function openStoryFilm(doc, {src, poster, title, label, muted = false, autoplay = true, onClose}) {
 if (doc.querySelector('.story-film-dialog')) return false;
 const dialog = doc.createElement('dialog'); dialog.className = 'story-film-dialog'; dialog.setAttribute('aria-label', label);
 Object.assign(dialog.style, {width: 'min(960px,calc(100vw - 24px))', maxHeight: 'calc(100dvh - 24px)', padding: '12px', border: '1px solid #9bbbae', borderRadius: '16px', background: '#122426', color: '#fff', textAlign: 'center', zIndex: '999'});
 const heading = doc.createElement('h2'); heading.textContent = title; Object.assign(heading.style, {margin: '2px 0 10px', fontSize: '1.2rem'});
 const video = doc.createElement('video'); video.src = src; if (poster) video.poster = poster;
 video.playsInline = true; video.controls = true; video.muted = muted; video.preload = 'auto'; video.setAttribute('aria-label', label);
 Object.assign(video.style, {display: 'block', width: '100%', maxHeight: 'calc(100dvh - 150px)', aspectRatio: '16 / 9', borderRadius: '10px', background: '#080e10'});
 const status = doc.createElement('p'); status.hidden = true; status.setAttribute('role', 'status');
 const skip = doc.createElement('button'); skip.type = 'button'; skip.className = 'btn primary'; skip.textContent = '건너뛰기';
 Object.assign(skip.style, {marginTop: '10px', minHeight: '48px', padding: '6px 22px'});
 dialog.append(heading, video, status, skip); doc.body.append(dialog); dialog.showModal();
 let done = false;
 const finish = () => { if (done) return; done = true; video.pause(); dialog.remove(); onClose?.(); };
 skip.addEventListener('click', () => dialog.close());
 video.addEventListener('ended', () => { skip.textContent = '계속하기'; skip.focus(); });
 video.addEventListener('error', () => { status.hidden = false; status.textContent = '지금은 영상을 열 수 없어. 「계속하기」를 눌러 이어 가자.'; skip.textContent = '계속하기'; });
 dialog.addEventListener('close', finish, {once: true});
 if (autoplay) video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
 return true;
}
