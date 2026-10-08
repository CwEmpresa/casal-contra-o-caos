import {createServer} from '../server/index.js';
import {execFile} from 'node:child_process';
const app=createServer();let selected=null;
for(let port=Number(process.env.PORT||3001);port<Number(process.env.PORT||3001)+20;port++){
 try{await new Promise((resolve,reject)=>{const onError=error=>{app.server.removeListener('listening',onListening);reject(error);};const onListening=()=>{app.server.removeListener('error',onError);resolve();};app.server.once('error',onError);app.server.once('listening',onListening);app.server.listen(port,'0.0.0.0');});selected=port;break;}
 catch(error){if(error.code!=='EADDRINUSE'){console.error(error.message);await app.close();process.exit(1);}}
}
if(!selected){console.error('Não foi encontrada uma porta livre entre 3001 e 3020. Feche a janela antiga do jogo.');await app.close();process.exit(1);}
const url=`http://localhost:${selected}`;
console.log(`\nCASAL CONTRA O CAOS — VERSÃO 3D\n\nJogo iniciado: ${url}\n\nDeixe esta janela aberta enquanto joga.\nCtrl+C encerra o servidor.\n`);
if(process.platform==='win32')execFile('cmd.exe',['/c','start','',url],()=>{});
else if(process.platform==='darwin')execFile('open',[url],()=>{});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>app.close().then(()=>process.exit(0)));
