import content from './content.json';
export const DATA = content;
export const STAGES = DATA.stages;
export const PAGES = DATA.pages;
export const SITES = [
 { id: 'classroom', name: '교실', icon: 'window', image: 'classroom', subtitle: '함께 지내는 공간' },
 { id: 'cafeteria', name: '급식 공간', icon: 'plate', image: 'condition', subtitle: '같이 먹는 시간' },
 { id: 'gym', name: '체육 활동 공간', icon: 'ball', image: 'field', subtitle: '물건을 함께 쓴 뒤' },
];
export const CLUE_ICONS: Record<string,string> = { CL01:'window',CL02:'ball',CL03:'hand',CL04:'plate',CL05:'air',CL06:'clock',CL07:'walk',CL08:'file' };
export const CLUE_NAMES: Record<string,string> = { CL01:'닫힌 창문',CL02:'함께 쓴 공',CL03:'간식 먹기 전',CL04:'공용 음식과 숟가락',CL05:'기침하는 순간',CL06:'느린 시계',CL07:'풀린 운동화 끈',CL08:'접힌 급식표' };
export const TARGETS = [ {id:'contact',name:'손·물건의 접촉',icon:'hand'}, {id:'shared-environment',name:'함께 있는 환경',icon:'window'}, {id:'respiratory',name:'기침과 주변 공간',icon:'air'}, {id:'meal',name:'음식·식기의 사용',icon:'plate'} ];
export const LABS = [ {id:'contact',name:'접촉',icon:'hand'}, {id:'droplet',name:'비말',icon:'air'}, {id:'air',name:'공기',icon:'window'}, {id:'water',name:'물',icon:'drop'}, {id:'saliva',name:'타액',icon:'plate'} ];
export const NODE_NAMES: Record<string,string> = {book:'책',studentA:'학생 A의 손',ball:'공',studentB:'학생 B의 손',door:'문손잡이',studentC:'학생 C의 손'};
export const ACTION_ICONS: Record<string,string> = {washHands:'hand',ventilation:'window',portionFood:'plate',coughEtiquette:'air',personalItems:'bag'};
export const EFFECTS: Record<string,string> = {washHands:'손에서 물건으로 이어지는 흔적이 줄었어요.',coughEtiquette:'가리지 않은 기침의 흔적 범위가 줄었어요.',ventilation:'공기 흐름이 생기며 주의 신호가 달라졌어요.',personalItems:'같은 컵을 통해 이어지는 접촉이 줄었어요.',portionFood:'개인 식기와 공용 음식의 접촉이 줄었어요.'};
export const asset = (name:string) => `${import.meta.env.BASE_URL}assets/${name}.webp`;
