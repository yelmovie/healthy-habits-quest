#!/usr/bin/env python3
"""인트로·아웃트로 합성: Flow 클립 3개 → 0.8초 디졸브, 자막·인물 이름표, 마지막 제목 로고, 게임 배경음 + 대사(대사 때 배경음 자동 낮춤).
사용: python3 compose.py intro|outro   (clips/<장면>.mp4 가 있어야 함)"""
import subprocess, sys, json
from pathlib import Path

O = Path(__file__).resolve().parent
APP = O.parents[1] / 'invisible-traces'
ASSETS = APP / 'public' / 'assets'
FONT = O / 'fonts' / 'NanumSquareNeo-cBd.ttf'
OUT = O / 'out'; OUT.mkdir(exist_ok=True); TXT = O / 'txt'; TXT.mkdir(exist_ok=True)
XF, CLIP, HOLD = 0.8, 7.9, 1.6
TOTAL = CLIP * 3 - XF * 2 + HOLD  # 23.8초
TEAL, PURPLE = '0x0d8079', '0x6a4cc4'

SEQ = {
 'intro': {
  'clips': ['I-1', 'I-2', 'I-3'], 'bgm': ASSETS / 'audio/bgm/main-theme.mp3', 'fade_in': 'black', 'logo_at': 19.0, 'badge': None,
  'lines': [
   (0.9, O / 'voice/movie-intro-1.mp3', '기록 파트너', TEAL, '어느 아침, 우리 학교에 이상한 흔적이 생겼어요.'),
   (8.3, O / 'voice/movie-intro-2.mp3', '자국 도깨비', PURPLE, '킥킥, 내 손자국은 아무도 못 찾을걸!'),
   (15.4, ASSETS / 'audio/voices/el-title-1.mp3', '기록 파트너', TEAL, '우리 학교에 남은 흔적을 찾아 줘!'),
  ]},
 'outro': {
  'clips': ['F-1', 'F-2', 'F-3'], 'bgm': ASSETS / 'audio/bgm/final-theme.mp3', 'fade_in': 'white', 'logo_at': 19.2, 'badge': '학교 과학 조사 완료',
  'lines': [
   (1.0, ASSETS / 'audio/voices/el-villain-5-5.mp3', '자국 도깨비', PURPLE, '흥, 지도를 돌려줄게. 낙서는 이제 내 수첩에만!'),
   (7.9, ASSETS / 'audio/voices/el-ending-2.mp3', '기록 파트너', TEAL, '손 씻기·기침 예절·환기·덜어 먹기는\n생활에서 모두 함께 실천해요.'),
   (15.6, ASSETS / 'audio/voices/el-ending-1.mp3', '기록 파트너', TEAL, '우리의 발견이 학교를 바꿨어요.'),
  ]},
}

def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)]).decode().strip())

def esc(p):  # drawtext 경로 이스케이프
    return str(p).replace('\\', '\\\\').replace(':', '\\:').replace("'", "\\'")

def build(kind):
    S = SEQ[kind]; args = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error']
    for c in S['clips']: args += ['-i', str(Path(__import__('os').environ.get('CLIPS', O / 'clips')) / f'{c}.mp4')]
    args += ['-loop', '1', '-t', f'{TOTAL}', '-i', str(ASSETS / 'title-logo.webp')]          # 3
    args += ['-i', str(S['bgm'])]                                                         # 4
    for _, v, *_ in S['lines']: args += ['-i', str(v)]                                    # 5..7
    f = []
    for i in range(3):
        f.append(f'[{i}:v]trim=0:{CLIP},setpts=PTS-STARTPTS,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,format=yuv420p,setsar=1[v{i}]')
    a = CLIP - XF; b = a + CLIP - XF
    f.append(f'[v0][v1]xfade=transition=fade:duration={XF}:offset={a}[x01]')
    f.append(f'[x01][v2]xfade=transition=fade:duration={XF}:offset={b}[xv]')
    fade_color = S['fade_in']
    f.append(f'[xv]tpad=stop_mode=clone:stop_duration={HOLD},fade=t=in:st=0:d=0.7:color={fade_color},fade=t=out:st={TOTAL-0.7}:d=0.7:color=black[base]')
    # 제목 로고: 위에서 살짝 내려오며 나타남
    T = S['logo_at']
    f.append(f'[3:v]scale=560:-1,format=rgba,fade=t=in:st={T}:d=0.7:alpha=1[logo]')
    f.append(f"[base][logo]overlay=x=(W-w)/2:y='34-22*(1-min(1,max(0,(t-{T})/0.7)))':enable='gte(t,{T})'[vl]")
    last = 'vl'; k = 0
    def alpha(s, e):
        return f"'if(lt(t,{s}+0.25),(t-{s})/0.25,if(gt(t,{e}-0.25),({e}-t)/0.25,1))'"
    for (st, voice, who, color, text) in S['lines']:
        e = round(st + dur(voice) + 0.5, 2)
        tf = TXT / f'{kind}-{k}.txt'; tf.write_text(text, encoding='utf-8')
        wf = TXT / f'{kind}-{k}-who.txt'; wf.write_text(who, encoding='utf-8')
        lines = text.count('\n') + 1
        sub_y = f'h-{52 + 44 * lines}'
        f.append(f"[{last}]drawtext=fontfile='{esc(FONT)}':textfile='{esc(tf)}':fontsize=34:line_spacing=10:fontcolor=white:box=1:boxcolor=0x103e43@0.80:boxborderw=16:x=(w-text_w)/2:y={sub_y}:alpha={alpha(st, e)}:enable='between(t,{st},{e})'[s{k}]")
        f.append(f"[s{k}]drawtext=fontfile='{esc(FONT)}':textfile='{esc(wf)}':fontsize=22:fontcolor=white:box=1:boxcolor={color}@0.95:boxborderw=9:x=(w-text_w)/2:y={sub_y}-58:alpha={alpha(st, e)}:enable='between(t,{st},{e})'[w{k}]")
        last = f'w{k}'; k += 1
    if S['badge']:
        bf = TXT / f'{kind}-badge.txt'; bf.write_text(S['badge'], encoding='utf-8'); B = T + 0.5
        f.append(f"[{last}]drawtext=fontfile='{esc(FONT)}':textfile='{esc(bf)}':fontsize=30:fontcolor=white:box=1:boxcolor={TEAL}@0.92:boxborderw=14:x=(w-text_w)/2:y=262:alpha='min(1,max(0,(t-{B})/0.5))':enable='gte(t,{B})'[vb]")
        last = 'vb'
    # 소리: 대사를 제자리에 놓고, 대사가 나올 때 배경음을 낮춘다
    for j, (st, *_rest) in enumerate(S['lines']):
        ms = int(st * 1000)
        f.append(f'[{5+j}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms},apad[n{j}]')
    f.append(f'[n0][n1][n2]amix=inputs=3:normalize=0,atrim=0:{TOTAL},asplit=2[nar][key]')
    f.append(f'[4:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{TOTAL},asetpts=PTS-STARTPTS,volume=0.42,afade=t=in:st=0:d=1.2,afade=t=out:st={TOTAL-1.8}:d=1.8[bg]')
    f.append('[bg][key]sidechaincompress=threshold=0.03:ratio=5:attack=30:release=400[duck]')
    f.append('[duck][nar]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]')
    out = OUT / f'{kind}-film.mp4'
    args += ['-filter_complex', ';'.join(f), '-map', f'[{last}]', '-map', '[aout]', '-t', f'{TOTAL}',
             '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-maxrate', '1800k', '-bufsize', '3600k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', str(out)]
    subprocess.run(args, check=True)
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-ss', '2.2', '-i', str(out), '-frames:v', '1', '-q:v', '4', str(OUT / f'{kind}-film-poster.jpg')], check=True)
    print(json.dumps({'out': str(out), 'seconds': round(dur(out), 2), 'MB': round(out.stat().st_size / 1e6, 2)}, ensure_ascii=False))

if __name__ == '__main__':
    build(sys.argv[1])
