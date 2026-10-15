import {weightColor} from './weight-map.js?v=0e64bb054b5f';

const WIDTH = 900, HEIGHT = 570;
const hiddenPoint = h => ({x: 380 + (h % 4) * 43, y: 155 + Math.floor(h / 4) * 39 - (h % 4) * 14});
const inputPoint = i => ({x: 43 + (i % 16) * 11.5, y: 174 + Math.floor(i / 16) * 11.5 - (i % 16) * 3.68});
const outputPoint = o => ({x: 738 + (o % 2) * 69, y: 116 + Math.floor(o / 2) * 49 - (o % 2) * 22});

export function createNetworkView(canvas, controls, onSelect) {
  const ctx = canvas.getContext('2d');
  const buttons = Array.from({length:24}, (_, h) => {
    const button = document.createElement('button'), p = hiddenPoint(h);
    button.type = 'button'; button.className = 'neuron-hit';
    button.style.left = `${p.x / WIDTH * 100}%`; button.style.top = `${p.y / HEIGHT * 100}%`;
    button.setAttribute('aria-label', `Prozkoumat neuron ${h + 1}`);
    button.title = `Prozkoumat neuron ${h + 1}`;
    button.addEventListener('click', () => onSelect(h));
    controls.append(button); return button;
  });
  function polygon(points, fill, stroke) {
    ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y)); ctx.closePath();
    if (fill) {ctx.fillStyle=fill;ctx.fill();}
    if (stroke) {ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  function plate(x,y,w,h) {
    const p=[{x,y},{x:x+w,y:y-w*.32},{x:x+w,y:y+h-w*.32},{x,y:y+h}];
    polygon([p[2],p[3],{x,y:y+h+9},{x:x+w,y:y+h-w*.32+9}],'#0b121a','#334958');
    polygon([p[1],p[2],{x:x+w,y:p[2].y+9},{x:x+w+5,y:p[1].y+6}],'#101923');
    polygon(p,'#1b2b38','#47616c');
  }
  function pixel(x,y,size,value,signed=false) {
    const color=signed && value<0 ? [236,146,175] : [154,236,195];
    const intensity=signed ? Math.min(1,Math.abs(value)*1.4) : value;
    const rgb=signed ? weightColor(value) : color.map((c,i)=>Math.round([23,38,48][i]+(c-[23,38,48][i])*intensity));
    const fill=`rgb(${rgb.join(',')})`;
    polygon([{x,y},{x:x+size,y:y-size*.32},{x:x+size,y:y+size*.68},{x,y:y+size}],fill);
  }
  function sphere(x,y,r,value,selected=false) {
    ctx.fillStyle='#080f1666';ctx.beginPath();ctx.ellipse(x+4,y+r+7,r*1.05,r*.38,0,0,Math.PI*2);ctx.fill();
    const gradient=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);
    gradient.addColorStop(0,`rgb(${70+value*175},${110+value*145},${100+value*130})`);
    gradient.addColorStop(.45,`rgb(${30+value*90},${65+value*130},${62+value*100})`);
    gradient.addColorStop(1,'#142f32');
    ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=selected?'#d8ffe9':'#638e85';ctx.lineWidth=selected?2:1;ctx.stroke();
    if(selected){ctx.beginPath();ctx.ellipse(x,y,r+6,r+3,-.32,0,Math.PI*2);ctx.strokeStyle='#a0f4c9';ctx.stroke();}
  }
  function link(a,b,weight,selected=false) {
    const alpha=selected ? Math.min(.8,.28+Math.abs(weight)*.2) : Math.min(.22,.04+Math.abs(weight)*.08);
    ctx.strokeStyle=weight>=0?`rgba(154,236,195,${alpha})`:`rgba(236,146,175,${alpha})`;
    ctx.lineWidth=selected?1+Math.min(2,Math.abs(weight)):.65;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  function text(value,x,y,color='#9aaeb9',size=12) {
    ctx.fillStyle=color;ctx.font=`${size}px monospace`;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(value,x,y);
  }
  return ({net,input,output,selectedNeuron,hasInput}) => {
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    text('VSTUP / 16 × 16',28,115,'#c2dad0',12);
    text('SKRYTÁ VRSTVA / 24',351,60,'#c2dad0',12);
    text('VÝSTUP / 0–9',708,25,'#c2dad0',12);
    ctx.strokeStyle='#263c4766';ctx.lineWidth=1;
    for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(20+i*110,430-i*35);ctx.lineTo(210+i*110,490-i*35);ctx.stroke();}
    plate(28,157,207,214);plate(351,132,180,258);plate(708,91,143,267);
    for(let h=0;h<24;h++){
      const end=hiddenPoint(h);
      for(let k=0;k<5;k++){
        const i=(h*31+k*53)%256,p=inputPoint(i);
        link({x:p.x+5,y:p.y+4},end,net.w1[h*256+i],h===selectedNeuron);
      }
      if(h===selectedNeuron || h%6===0) for(let o=0;o<10;o++) link(end,outputPoint(o),net.w2[o*24+h],h===selectedNeuron);
    }
    for(let i=0;i<256;i++){const p=inputPoint(i);pixel(p.x,p.y,10.1,input[i]);}
    for(let h=0;h<24;h++){
      const p=hiddenPoint(h);sphere(p.x,p.y,12,output.hidden[h],h===selectedNeuron);
      buttons[h].setAttribute('aria-pressed',h===selectedNeuron?'true':'false');
    }
    const best=output.probabilities.indexOf(Math.max(...output.probabilities));
    for(let o=0;o<10;o++){
      const p=outputPoint(o),v=hasInput?output.probabilities[o]:0;
      sphere(p.x,p.y,16,v,hasInput&&best===o);
      text(o,p.x-4,p.y+5,'#e7fff0',14);
      text(hasInput?`${Math.round(v*100)}%`:'—',p.x-10,p.y+32,'#b0c9c3',11);
    }
    text('256 PIXELŮ',28,405);text('KLIKNI NA KULIČKU',351,411,'#b5dacb',11);text('10 ČÍSLIC',745,379);
    const chosen=hiddenPoint(selectedNeuron);
    ctx.strokeStyle='#c9f4df';ctx.lineWidth=1.4;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(chosen.x,chosen.y+18);ctx.lineTo(550,378);ctx.lineTo(593,403);ctx.stroke();ctx.setLineDash([]);
    plate(591,402,128,132);
    for(let i=0;i<256;i++)pixel(598+(i%16)*7.2,410+Math.floor(i/16)*7.2-(i%16)*2.304,6.6,net.w1[selectedNeuron*256+i],true);
    text(`POD LUPOU / NEURON ${selectedNeuron+1}`,291,454,'#d6f8e7',14);
    text('256 vstupních vah',291,479);
    text(`Aktivace ${output.hidden[selectedNeuron].toFixed(3)}`,291,502,'#9aecc3');
    text(`Bias ${net.b1[selectedNeuron].toFixed(5)}`,291,524,'#9aecc3');
    text('Stejné pixely, jiná váha každého z nich.',291,551,'#9aaeb9',11);
  };
}
