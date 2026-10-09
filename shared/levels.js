const product=(id,base,name,variant,amount,mark,color,fixture,sector,description,icon)=>({id,base,name,variant,amount,mark,color,fixture,sector,description,icon,category:sector});
export const PRODUCTS=[
 product('milk','milk','Leite','Integral','1 L','CÍRCULO','#64adc0','fridge','A','Vai no cereal. Preciso da versão integral, de 1 litro, com selo circular.','🥛'),
 product('milk-light','milk','Leite','Desnatado','1 L','TRIÂNGULO','#85a6ce','fridge','A','Vai no cereal. Preciso da versão desnatada, de 1 litro, com selo triangular.','🥛'),
 product('cheese','cheese','Queijo','Suave','400 g','CÍRCULO','#e1b35d','deli','A','Derrete no sanduíche. Escolha o suave, de 400 gramas, com selo circular.','🧀'),
 product('cheese-aged','cheese','Queijo','Curado','250 g','TRIÂNGULO','#db8d47','deli','A','Derrete no sanduíche. Escolha o curado, de 250 gramas, com selo triangular.','🧀'),
 product('bread','bread','Pão','Tradicional','500 g','CÍRCULO','#d3ad73','bakery','B','Serve de base para uma torrada. Tradicional, 500 gramas, selo circular.','🍞'),
 product('bread-grain','bread','Pão','Integral','350 g','TRIÂNGULO','#a77d52','bakery','B','Serve de base para uma torrada. Integral, 350 gramas, selo triangular.','🍞'),
 product('eggs','eggs','Ovos','Brancos','6 un','CÍRCULO','#d9d5b4','eggs','B','Quebre a casca antes de cozinhar. Brancos, bandeja de seis, selo circular.','🥚'),
 product('eggs-farm','eggs','Ovos','Caipiras','6 un','TRIÂNGULO','#c9a26d','eggs','B','Quebre a casca antes de cozinhar. Caipiras, bandeja de seis, selo triangular.','🥚'),
 product('apple','apple','Maçã','Vermelha','4 un','CÍRCULO','#d66c60','fruit','C','Fruta redonda de casca lisa. Vermelha, pacote com quatro, selo circular.','🍎'),
 product('apple-green','apple','Maçã','Verde','4 un','TRIÂNGULO','#99b76b','fruit','C','Fruta redonda de casca lisa. Verde, pacote com quatro, selo triangular.','🍏'),
 product('carrot','carrot','Cenoura','Inteira','1 kg','CÍRCULO','#e19b54','vegetables','C','Raiz laranja para a sopa. Inteira, pacote de 1 quilo, selo circular.','🥕'),
 product('carrot-baby','carrot','Cenoura','Baby','300 g','TRIÂNGULO','#e6b16e','vegetables','C','Raiz laranja para a sopa. Baby, pacote de 300 gramas, selo triangular.','🥕'),
 product('coffee','coffee','Café','Intenso','500 g','CÍRCULO','#a77653','coffee','D','Pó para a bebida que desperta. Intenso, 500 gramas, selo circular.','☕'),
 product('coffee-decaf','coffee','Café','Descafeinado','250 g','TRIÂNGULO','#a99380','coffee','D','Pó para a bebida que desperta. Descafeinado, 250 gramas, selo triangular.','☕'),
 product('rice','rice','Arroz','Branco','1 kg','CÍRCULO','#b1c9a0','sacks','D','Grãos que acompanham o feijão. Branco, 1 quilo, selo circular.','🍚'),
 product('rice-brown','rice','Arroz','Integral','1 kg','TRIÂNGULO','#b99c73','sacks','D','Grãos que acompanham o feijão. Integral, 1 quilo, selo triangular.','🍚')
].map((p,i)=>({...p,sku:`M${String(i+1).padStart(2,'0')}`}));
export const SECTORS=[
 {id:'A',name:'Frios',color:'#74d6e5',x:0,y:0,w:13,h:5,gate:{x:12.2,y:2.6,w:.5,h:.5},aisles:'01 / 02'},
 {id:'B',name:'Padaria e granja',color:'#ffc779',x:17,y:0,w:11,h:11,gate:{x:23,y:3.6,w:.5,h:.5},aisles:'03 / 04'},
 {id:'C',name:'Hortifrúti',color:'#a7dc83',x:0,y:10,w:9,h:11,gate:{x:8.4,y:17,w:.5,h:.5},aisles:'05 / 06'},
 {id:'D',name:'Mercearia',color:'#dba4ef',x:10,y:5,w:12,h:14,gate:{x:21,y:14.8,w:.5,h:.5},aisles:'07 / 08'}
];
const positions=[
 [3,1.2,0],[5.5,1.2,0],[8,1.2,0],[10.5,1.2,0],
 [19,1.2,0],[21.6,1.2,0],[26,6,-Math.PI/2],[26,9,-Math.PI/2],
 [3,13.5,0],[6,13.5,0],[3,17,0],[6,17,0],
 [12.5,9,Math.PI/2],[12.5,13,Math.PI/2],[18,9,Math.PI/2],[18,13,Math.PI/2]
];
const decor=[12.5,18].flatMap(x=>[6,16].map(y=>({x,y,w:1.1,h:2.2,rotation:Math.PI/2})));
export const SUPERMARKET={id:'supermarket',name:'Mercado da Meia-noite',width:28,height:28,
 shelves:PRODUCTS.map((p,i)=>{const [x,y,rotation]=positions[i],side=rotation!==0;return {x,y,rotation,w:side?(p.sector==='D'?1.9:1.1):2.2,h:side?2.2:1.1,sector:p.sector,aisle:Math.floor(i/2)+1,approach:{x:x+Math.sin(rotation)*(p.sector==='D'?1.5:1.35),y:y+Math.cos(rotation)*1.35}};}),
 shelfSize:{w:2.2,h:1.1},decor,
 walls:[{x:3.5,y:22,w:7,h:.18},{x:7,y:25,w:.18,h:6}],
 obstacles:[...decor,...SECTORS.map(s=>s.gate),{x:18.8,y:23.7,w:5,h:1},{x:3.5,y:24.5,w:5,h:.8},{x:23.5,y:25.6,w:1.2,h:.7},{x:10,y:20,w:.52,h:.4},{x:.8,y:25,w:1.2,h:.6},{x:24.5,y:22,w:2,h:1.8},{x:24.4,y:26.3,w:.9,h:1.1}],
 console:{x:3.5,y:25.3},belt:{x:17.5,y:23.7},checkout:{x:23.5,y:24.7},exit:{x:26.5,y:27.3},relay:{x:10,y:20},
 cart:{x:24.4,y:26.3},spawns:[{x:3.5,y:26.3},{x:10,y:25.2}],operatorBounds:{x:.4,y:22.4,w:6.2,h:5.2}
};
export const LEVELS={supermarket:SUPERMARKET};
export const SYMBOLS=['◆','●','▲','✚'];
export const ROUTES=['FRIO','SECO','FRESCO','FRÁGIL'];
export const EVENTS={overload:{name:'Sobrecarga',hint:'Comprador: leia o painel de rearme junto à central. Operador: digite o código.',duration:18}};
