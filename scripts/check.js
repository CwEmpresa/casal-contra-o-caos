import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
async function check(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(['node_modules','.git'].includes(entry.name))continue;const p=`${dir}/${entry.name}`;if(entry.isDirectory())await check(p);else if(p.endsWith('.js')){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status){console.error(r.stderr);process.exit(1);}}}}
await check('.');console.log('Todos os módulos JavaScript têm sintaxe válida.');
