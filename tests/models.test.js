import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {PRODUCTS} from '../shared/levels.js';
// CPU-side geometry validation without a browser/GPU. Canvas is used for labels only.
const context={fillRect(){},strokeRect(){},fillText(){}};
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};
const source=(await readFile(new URL('../client/game/models.js',import.meta.url),'utf8')).replace("'/vendor/three.module.js'",JSON.stringify(new URL('../node_modules/three/build/three.module.js',import.meta.url).href)).replace("'/shared/levels.js'",JSON.stringify(new URL('../shared/levels.js',import.meta.url).href));
const models=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
// The renderer constructs its avatar before any market labels. Preserve that order.
models.makeAvatar(0);
test('sixteen labeled product variants, four sectors and spatially merged store have finite geometry',()=>{
 const signatures=[];
 for(const item of PRODUCTS){const root=models.makeProduct(item.id);root.updateMatrixWorld(true);let signature='';root.traverse(node=>{if(node.isMesh){assert.ok(node.matrixWorld.elements.every(Number.isFinite));signature+=node.geometry.type+node.matrixWorld.elements.join(',')+node.material.color.getHexString();}});signatures.push(signature);}
 assert.equal(new Set(signatures).size,16);
 const market=models.createMarket(PRODUCTS.map(p=>p.id)),batched=models.batchStatic(market.root);assert.ok(batched.children.some(n=>n.material.defines.LABEL_MAP&&n.material.uniforms.atlas.value?.isCanvasTexture),'labels remain textured when avatar is constructed first');let before=0,after=0,vertices=0;market.root.traverse(n=>{if(n.isMesh)before++;});batched.traverse(n=>{if(n.isMesh){after++;vertices+=n.geometry.attributes.position.count;for(const v of n.geometry.attributes.position.array)assert.ok(Number.isFinite(v));assert.ok(n.matrix.elements.every(Number.isFinite));}});assert.ok(vertices>10000);assert.ok(after<before/20);assert.ok(after<=40);assert.ok(vertices/3<170000);console.log(`Market: ${before} source meshes → ${after} spatial batches, ${vertices/3} triangles.`);models.disposeOwned(batched);
});
test('basic partner avatar animates walking and carrying with finite transforms',()=>{
 const avatar=models.makeAvatar(0);models.animateAvatar(avatar,{vx:0,vy:0},1.3);const idle=avatar.userData.legs[0].rotation.x;models.animateAvatar(avatar,{vx:3,vy:0},1.3);assert.notEqual(avatar.userData.legs[0].rotation.x,idle);models.animateAvatar(avatar,{vx:0,vy:0,holding:'milk'},1.3);assert.notEqual(avatar.userData.arms[1].rotation.x,0);avatar.updateMatrixWorld(true);avatar.traverse(n=>assert.ok(n.matrixWorld.elements.every(Number.isFinite)));
});
