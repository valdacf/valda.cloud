import {encodeFP8} from './precision.js?v=386f723277e3';

export function weightColor(value) {
  const color = value < 0 ? [236,146,175] : [154,236,195];
  const strength = Math.abs(value) / (.2 + Math.abs(value));
  return color.map((c,i) => Math.round([23,38,48][i] + (c - [23,38,48][i]) * strength));
}

export function createWeightMap(onSelect) {
  const detail = document.getElementById('parameter-detail');
  const maps = [
    {id:'weight-map-input',key:'w1',width:256,height:24},
    {id:'weight-map-output',key:'w2',width:24,height:10},
    {id:'weight-map-bias',key:'bias',width:34,height:1}
  ];
  let state, inspected = {key:'w1',index:0};
  const valueAt = (net,key,index) => key === 'bias' ? index < 24 ? net.b1[index] : net.b2[index-24] : net[key][index];
  function describe() {
    if (!state) return;
    const {key,index} = inspected;
    const original = valueAt(state.original,key,index), used = valueAt(state.active,key,index);
    const name = key === 'w1' ? `Neuron ${Math.floor(index/256)+1} · pixel ${index%256+1}` :
      key === 'w2' ? `Výstup ${Math.floor(index/24)} · neuron ${index%24+1}` :
      index < 24 ? `Bias neuronu ${index+1}` : `Bias výstupu ${index-24}`;
    detail.textContent = `${name} · FP64: ${original} · ${state.mode === 'fp8' ? `FP8: ${used} · bity: ${encodeFP8(original).toString(2).padStart(8,'0')}` : 'bez zaokrouhlení'}`;
    maps.find(map=>map.key===key).canvas.setAttribute('aria-valuetext', `${name}, hodnota ${used}`);
  }
  function inspect(map,index,select) {
    inspected = {key:map.key,index};
    map.canvas.setAttribute('aria-valuenow', index+1);
    if (select) {
      if (map.key === 'w1') onSelect(Math.floor(index/256));
      else if (map.key === 'w2') onSelect(index%24);
      else if (index<24) onSelect(index);
    }
    describe();
  }
  for (const map of maps) {
    map.canvas = document.getElementById(map.id);
    const indexAt = event => {
      const rect=map.canvas.getBoundingClientRect();
      const col=Math.max(0,Math.min(map.width-1,Math.floor((event.clientX-rect.left)/rect.width*map.width)));
      const row=Math.max(0,Math.min(map.height-1,Math.floor((event.clientY-rect.top)/rect.height*map.height)));
      return row*map.width+col;
    };
    map.canvas.addEventListener('pointermove', event => inspect(map,indexAt(event),false));
    map.canvas.addEventListener('click', event => inspect(map,indexAt(event),true));
    map.canvas.addEventListener('focus', () => {
      if(inspected.key!==map.key) inspect(map,map.key==='w1'?state.selectedNeuron*256:0,false);
    });
    map.canvas.addEventListener('keydown', event => {
      const deltas={ArrowLeft:-1,ArrowRight:1,ArrowUp:-map.width,ArrowDown:map.width};
      if (!(event.key in deltas)) return;
      event.preventDefault();
      const current=inspected.key===map.key?inspected.index:0;
      inspect(map,Math.max(0,Math.min(map.width*map.height-1,current+deltas[event.key])),true);
    });
  }
  return next => {
    state=next;
    for (const map of maps) {
      const ctx=map.canvas.getContext('2d'), pixels=ctx.createImageData(map.width,map.height);
      for(let i=0;i<map.width*map.height;i++) {
        const color=weightColor(valueAt(state.active,map.key,i));
        pixels.data.set([...color,255],i*4);
      }
      ctx.putImageData(pixels,0,0);
    }
    document.getElementById('weight-row').style.top=`${state.selectedNeuron/24*100}%`;
    document.getElementById('map-selection').textContent=`Vybraný neuron: ${state.selectedNeuron+1}`;
    describe();
  };
}
