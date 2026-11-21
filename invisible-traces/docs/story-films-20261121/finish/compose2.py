#!/usr/bin/env python3
"""12번 인트로·파이널 최종 합성 (2026-11-21 마무리판, _shared/FILMS-FINISH-20261121.md 기준).
1) 장면 3개 → 0.45초 교차 페이드, 끝에 정지 화면을 두고 제목 로고(앱 title-logo.webp)
2) 모션그래픽(ASS, libass): 인트로 끝 호기심 한 줄 / 파이널 끝 흔적 빛 색 꽃가루·반짝임·「학교 과학 조사 완료!」 도장
3) 소리 트랙은 대사만(줄마다 -16.5 LUFS로 맞춤). 배경 음악은 앱 음악 시스템이 설정대로 튼다.
4) 자막은 _shared/caption-motion-20261118/burn.py(주아체, 이름표·스윕·[키워드]·진행 줄)로 입힌다.
사용: python3 compose2.py intro|final"""
import json, math, os, random, subprocess, sys
from pathlib import Path

O = Path(__file__).resolve().parent
APP = O.parents[1] / 'invisible-traces'
ASSETS = APP / 'public' / 'assets'
BURN = Path('/Volumes/T7 Shield/iscreammedia_sc34/_shared/caption-motion-20261118/burn.py')
JUA_DIR = BURN.parent / 'fonts'
CLIPS = Path(os.environ.get('CLIPS', O / 'clips'))
OUT = O / 'out2'; OUT.mkdir(exist_ok=True)
XF, CLIP = 0.45, 7.9
TARGET_LUFS = -16.5
WHO = {'기록 파트너': '#0d8079', '자국 도깨비': '#6a4cc4', '과학 조사원': '#2f6fcf'}

# (시작, 음원, 화자, 자막, 말 끝 시점(음원 안))
SEQ = {
 'intro': {'clips': ['I-1', 'I-2', 'I-3'], 'hold': 2.2, 'logo_at': 18.6, 'out': 'intro-film',
  'lines': [
   (0.8, O / 'voice/movie-intro-1.mp3', '기록 파트너', '어느 아침, 우리 학교에 이상한 [흔적]이 생겼어요.', 3.85),
   (8.3, O / 'voice/movie-intro-2.mp3', '자국 도깨비', '킥킥, 내 [손자국]은 아무도 못 찾을걸!', 3.59),
   (15.6, ASSETS / 'audio/voices/el-title-1.mp3', '기록 파트너', '우리 학교에 남은 [흔적]을 찾아 줘!', 2.43),
  ]},
 'final': {'clips': ['F-1', 'F-2', 'F-3'], 'hold': 3.7, 'logo_at': 23.4, 'out': 'outro-film',
  'lines': [
   (0.9, ASSETS / 'audio/voices/el-villain-5-5.mp3', '자국 도깨비', '흥, [지도]를 돌려줄게. 낙서는 이제 내 수첩에만!', 4.52),
   (7.9, ASSETS / 'audio/voices/el-ending-2.mp3', '기록 파트너', '손 씻기·기침 예절·환기·덜어 먹기는\n생활에서 모두 함께 [실천]해요.', 6.27),
   (15.2, ASSETS / 'audio/voices/el-ending-1.mp3', '기록 파트너', '우리의 [발견]이 학교를 바꿨어요.', 2.61),
   (18.0, O / 'voice/movie-final-3b.mp3', '과학 조사원', '[해냈어요]! 함께한 덕분에 숨은 흔적을\n모두 밝혀냈어요. 고마워요!', 5.45),
  ]},
}

def run(cmd): subprocess.run(cmd, check=True)
def probe_dur(p): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)]).decode())
def lufs(p):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(p), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float([l for l in r.splitlines() if l.strip().startswith('I:')][-1].split()[1])
def ts(t):
    cs = int(round(max(0, t) * 100)); return f'{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}'

def motion_ass(kind, total, T):
    """1920x1080 기준 ASS. 인트로: 로고 아래 호기심 한 줄. 파이널: 꽃가루·반짝임·도장."""
    head = ['[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1920', 'PlayResY: 1080', 'WrapStyle: 2', '',
            '[V4+ Styles]', 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
            'Style: Hook,Jua,60,&H00FFFFFF,&H00FFFFFF,&H00433E10,&H64000000,0,0,0,0,100,100,0,0,1,6,3,5,0,0,0,1',
            'Style: Stamp,Jua,64,&H00FFFFFF,&H00FFFFFF,&H00797E0D,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1',
            'Style: Shape,Jua,20,&H00FFFFFF,&H00FFFFFF,&H00FFFFFF,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1', '',
            '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
    ev = []
    if kind == 'intro':
        s = T + 0.8
        ev.append(f'Dialogue: 5,{ts(s)},{ts(total)},Hook,,0,0,0,,{{\\pos(960,452)\\fad(450,0)\\blur1\\t(0,450,\\fscx100\\fscy100)\\fscx92\\fscy92}}흔적은 어디에서 시작됐을까?')
        # 로고 둘레에서 흔적 빛 점 몇 개가 반짝 떠오른다
        rnd = random.Random(12)
        for i in range(10):
            x, y = rnd.randint(560, 1360), rnd.randint(150, 400); st = T + 0.2 + i * 0.12
            col = ['&H006AF5D9&', '&H00F2C79B&', '&H00FFFFFF&'][i % 3]
            ev.append(f'Dialogue: 4,{ts(st)},{ts(st + 1.4)},Shape,,0,0,0,,{{\\an5\\pos({x},{y})\\p1\\bord0\\shad0\\blur3\\1c{col}\\fscx40\\fscy40\\t(0,350,\\fscx120\\fscy120)\\t(350,1400,\\fscx60\\fscy60\\alpha&HFF&)}}m 0 -24 l 6 -6 24 0 6 6 0 24 -6 6 -24 0 -6 -6{{\\p0}}')
    else:
        C0 = 18.0  # 「해냈어요」와 함께 꽃가루
        rnd = random.Random(34)
        cols = ['&H006AF5D9&', '&H00797E0D&', '&H00C4566A&', '&H005CD3FF&', '&H00FFFFFF&', '&H00E2A3B1&']
        for i in range(64):
            x0 = rnd.randint(40, 1880); st = C0 + rnd.uniform(0, 3.2); dur = rnd.uniform(2.6, 4.2)
            x1 = x0 + rnd.randint(-160, 160); y1 = rnd.randint(760, 1140); rot = rnd.choice([-1, 1]) * rnd.randint(240, 720)
            w, h = rnd.choice([(14, 26), (18, 18), (10, 30)]); col = rnd.choice(cols)
            ev.append(f'Dialogue: 3,{ts(st)},{ts(min(total, st + dur))},Shape,,0,0,0,,{{\\an5\\move({x0},-40,{x1},{y1})\\p1\\bord0\\shad0\\1c{col}\\frz{rnd.randint(0,360)}\\t(\\frz{rot})\\t({int(dur*700)},{int(dur*1000)},\\alpha&HFF&)}}m 0 0 l {w} 0 {w} {h} 0 {h}{{\\p0}}')
        # 도장: 「학교 과학 조사 완료!」 팝
        S = T + 0.5
        box = 'm 18 0 l 702 0 b 712 0 720 8 720 18 l 720 112 b 720 122 712 130 702 130 l 18 130 b 8 130 0 122 0 112 l 0 18 b 0 8 8 0 18 0'
        ev.append(f'Dialogue: 6,{ts(S)},{ts(total)},Shape,,0,0,0,,{{\\an5\\pos(960,470)\\p1\\bord5\\3c&H00FFFFFF&\\shad3\\4c&H64000000&\\1c&H00797E0D&\\fscx150\\fscy150\\alpha&HFF&\\t(0,180,\\fscx92\\fscy92\\alpha&H00&)\\t(180,320,\\fscx100\\fscy100)\\frz-4}}{box}{{\\p0}}')
        ev.append(f'Dialogue: 7,{ts(S)},{ts(total)},Stamp,,0,0,0,,{{\\pos(960,470)\\fscx150\\fscy150\\alpha&HFF&\\t(0,180,\\fscx92\\fscy92\\alpha&H00&)\\t(180,320,\\fscx100\\fscy100)\\frz-4}}학교 과학 조사 완료!')
        for i, (x, y) in enumerate([(560, 400), (1360, 410), (620, 560), (1300, 560), (960, 330)]):
            st = S + 0.25 + i * 0.08
            ev.append(f'Dialogue: 8,{ts(st)},{ts(st + 1.6)},Shape,,0,0,0,,{{\\an5\\pos({x},{y})\\p1\\bord0\\blur2\\1c&H006AF5D9&\\fscx30\\fscy30\\t(0,300,\\fscx130\\fscy130)\\t(300,1600,\\fscx70\\fscy70\\alpha&HFF&)}}m 0 -30 l 7 -7 30 0 7 7 0 30 -7 7 -30 0 -7 -7{{\\p0}}')
    return '\n'.join(head + ev) + '\n'

def build(kind):
    S = SEQ[kind]; total = round(CLIP * 3 - XF * 2 + S['hold'], 2); T = S['logo_at']
    ass = OUT / f'{kind}-motion.ass'; ass.write_text(motion_ass(kind, total, T), encoding='utf-8')
    args = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error']
    for c in S['clips']: args += ['-i', str(CLIPS / f'{c}.mp4')]
    args += ['-loop', '1', '-t', f'{total}', '-i', str(ASSETS / 'title-logo.webp')]
    for _, v, *_ in S['lines']: args += ['-i', str(v)]
    f = []
    for i in range(3):
        f.append(f'[{i}:v]trim=0:{CLIP},setpts=PTS-STARTPTS,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,format=yuv420p,setsar=1[v{i}]')
    a = CLIP - XF; b = a + CLIP - XF
    f.append(f'[v0][v1]xfade=transition=fade:duration={XF}:offset={a}[x01]')
    f.append(f'[x01][v2]xfade=transition=fade:duration={XF}:offset={b}[xv]')
    fin = 'black' if kind == 'intro' else 'white'
    f.append(f"[xv]tpad=stop_mode=clone:stop_duration={S['hold']},fade=t=in:st=0:d=0.6:color={fin},fade=t=out:st={total-0.6}:d=0.6:color=black[base]")
    f.append(f'[3:v]scale=548:-1,format=rgba,fade=t=in:st={T}:d=0.6:alpha=1[logo]')
    ly = 46 if kind == 'intro' else 40
    f.append(f"[base][logo]overlay=x=(W-w)/2:y='{ly}-18*(1-min(1,max(0,(t-{T})/0.6)))':enable='gte(t,{T})'[vl]")
    f.append(f"[vl]subtitles='{str(ass).replace(':', chr(92)+':')}':fontsdir='{str(JUA_DIR).replace(':', chr(92)+':')}'[vout]")
    mix = []
    for j, (st, v, *_r) in enumerate(S['lines']):
        g = TARGET_LUFS - lufs(v); ms = int(st * 1000)
        f.append(f'[{4+j}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g:.2f}dB,adelay={ms}|{ms},apad[n{j}]'); mix.append(f'[n{j}]')
    f.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,atrim=0:{total},alimiter=limit=0.89[aout]")
    src = OUT / f'{kind}-nocap.mp4'
    args += ['-filter_complex', ';'.join(f), '-map', '[vout]', '-map', '[aout]', '-t', f'{total}',
             '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-maxrate', '1800k', '-bufsize', '3600k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', str(src)]
    run(args)
    cues = []
    for (st, v, who, text, speech_end) in S['lines']:
        cues.append({'s': round(st - 0.15, 2), 'e': round(st + speech_end + 0.6, 2), 'speech': [round(st, 2), round(st + speech_end, 2)], 'who': who, 'text': text})
    film = {'src': str(src), 'out': str(OUT / f"{S['out']}.mp4"), 'theme': {'box': '#103e43', 'accent': '#d9f56a', 'hot': '#d9f56a'},
            'speakers': {k: [v, '#ffffff'] for k, v in WHO.items()}, 'bottom': 64, 'sweep': True, 'cues': cues}
    fj = OUT / f'{kind}.json'; fj.write_text(json.dumps(film, ensure_ascii=False, indent=1), encoding='utf-8')
    py = os.path.expanduser('~/.local/share/uv/tools/earshot/bin/python')
    run([py, str(BURN), str(fj)])
    out = Path(film['out'])
    run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-ss', '2.2', '-i', str(out), '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '4', str(OUT / f"{S['out']}-poster.jpg")])
    print(json.dumps({'out': str(out), 'seconds': round(probe_dur(out), 2), 'MB': round(out.stat().st_size / 1e6, 2)}, ensure_ascii=False))

if __name__ == '__main__':
    build(sys.argv[1])
