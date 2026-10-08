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
 {id:'A',name:'Frios',color:'#6bb8ce',x:0,y:0,w:13,h:11,gate:{x:13,y:6,w:.22,h:2.6},aisles:'01 / 02'},
 {id:'B',name:'Padaria e granja',color:'#d6aa71',x:15,y:0,w:13,h:11,gate:{x:15,y:6,w:.22,h:2.6},aisles:'03 / 04'},
 {id:'C',name:'Hortifrúti',color:'#99b982',x:0,y:13,w:13,h:10,gate:{x:13,y:18,w:.22,h:2.6},aisles:'05 / 06'},
 {id:'D',name:'Estoque e secos',color:'#bd957e',x:15,y:13,w:13,h:10,gate:{x:15,y:18,w:.22,h:2.6},aisles:'07 / 08'}
];
const walls=[];
for(const s of SECTORS){const edge=s.id==='A'||s.id==='C'?13:15;for(const [start,end]of [[s.y,s.gate.y-1.3],[s.gate.y+1.3,s.y+s.h]])walls.push({x:edge,y:(start+end)/2,w:.22,h:end-start});for(const y of [s.y,s.y+s.h])if(y>0)walls.push({x:s.x+s.w/2,y,w:s.w,h:.22});}
walls.push({x:4,y:25,w:8,h:.18},{x:8,y:27.5,w:.18,h:5});
export const SUPERMARKET={id:'supermarket',name:'Mercado da Meia-noite',width:28,height:30,
 shelves:PRODUCTS.map((p,i)=>{const s=SECTORS.find(s=>s.id===p.sector),j=i%4;return {x:s.x+4+(j%2)*5,y:s.y+3.8+Math.floor(j/2)*4,sector:s.id,aisle:Math.floor(i/2)+1};}),
 shelfSize:{w:2.2,h:1.1},walls,obstacles:[{x:19,y:26,w:5,h:1},{x:4,y:26.4,w:5,h:.8},{x:22.5,y:28,w:1.2,h:.7},{x:12,y:11.45,w:.52,h:.4},{x:.8,y:26.6,w:1.2,h:.6},{x:24.22,y:24.6,w:1.9,h:1.75},{x:23.8,y:28.5,w:.9,h:1.1}],
 console:{x:4,y:27.2},belt:{x:18,y:26},checkout:{x:22.5,y:27.1},exit:{x:26.5,y:29},relay:{x:12,y:11.45},
 cart:{x:23.8,y:28.5},spawns:[{x:4,y:28.2},{x:14,y:26.5}],operatorBounds:{x:.4,y:25.5,w:7.2,h:4.1}
};
export const LEVELS={supermarket:SUPERMARKET};
export const SYMBOLS=['◆','●','▲','✚'];
export const ROUTES=['FRIO','SECO','FRESCO','FRÁGIL'];
export const EVENTS={overload:{name:'Sobrecarga',hint:'Comprador: leia o código do painel no cruzamento central. Operador: rearme o circuito.',duration:18}};
