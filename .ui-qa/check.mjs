// Run from .ui-qa after npm install --no-save --package-lock=false playwright-core.
// Start the client on http://127.0.0.1:4173 first. All gameplay API requests are mocked.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true});
const page = await browser.newPage({viewport:{width:360,height:640}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/health',r=>r.fulfill({json:{ok:true,service:'worldsea-server',time:new Date().toISOString()}}));
await page.goto('http://127.0.0.1:4173/');
await page.locator('.tabbar').waitFor();
const report={checks:[],errors};
const check=(name,pass,detail)=>report.checks.push({name,pass,detail});
await page.screenshot({path:'main-360.png'});
check('preview boot',await page.locator('.phase-preview').count()===1);
for (const label of ['샵','사육','원정','도감','상점']) {
  await page.locator('.tabbar button').filter({has:page.getByText(label,{exact:true})}).click();
  check('tab '+label,await page.locator('.tabbar button').filter({has:page.getByText(label,{exact:true})}).getAttribute('aria-pressed')==='true');
}
await page.locator('.tabbar button').filter({has:page.getByText('원정',{exact:true})}).click();
await page.getByRole('button',{name:'루나',exact:true}).click();
check('preview hunter select',await page.getByRole('button',{name:'루나',exact:true}).getAttribute('aria-pressed')==='true');
check('preview hunter label matches',(await page.getByRole('combobox',{name:'헌터',exact:true}).textContent()).includes('루나'));
await page.getByRole('button',{name:'50',exact:true}).click();
check('repeat preset',await page.getByRole('spinbutton',{name:'반복 횟수',exact:true}).inputValue()==='50');
check('locked region disabled',await page.getByRole('button',{name:'데본기 · 잠김'}).isDisabled());
check('preview start disabled',await page.getByRole('button',{name:'수색 시작',exact:true}).isDisabled());
await page.screenshot({path:'expedition-360.png'});
await page.locator('.expedition-sheet').evaluate(e=>e.scrollTop=0);
await page.screenshot({path:'expedition-top-360.png'});
for(const label of ['진행 현황','결과 수령']) {
  await page.getByRole('navigation',{name:'원정 단계'}).getByRole('button',{name:new RegExp(label)}).click();
  check('step '+label,await page.locator('.expedition-empty').isVisible());
  await page.getByRole('button',{name:'수색 설정으로'}).click();
}
await page.getByRole('button',{name:/메뉴, 새 소식/}).click();
check('menu open',await page.getByRole('menu').isVisible());
check('preview menu disabled',await page.getByRole('menuitem',{name:'새로고침'}).isDisabled());
await page.keyboard.press('Escape');
check('menu Escape closes',await page.getByRole('menu').count()===0);
await page.locator('.tabbar button').filter({has:page.getByText('샵',{exact:true})}).click();
check('menu tab closes',await page.getByRole('menu').count()===0);
const dead=await page.locator('button').evaluateAll(bs=>bs.filter(b=>!b.disabled&&!Object.keys(b).some(k=>k.startsWith('__reactProps')&&b[k]?.onClick)&&b.type!=='submit').map(b=>b.getAttribute('aria-label')||b.textContent));
check('main action handlers',dead.length===0,dead);
for(const width of [360,500,1280]) {
  await page.setViewportSize({width,height:width===1280?800:640});
  const overflow=await page.locator('.topbar .panel').evaluateAll(bs=>bs.filter(b=>b.scrollWidth>b.clientWidth+1).map(b=>({label:b.getAttribute('aria-label'),client:b.clientWidth,scroll:b.scrollWidth})));
  check('HUD overflow '+width,overflow.length===0,overflow);
}
await page.setViewportSize({width:360,height:640});
await page.getByRole('button',{name:/프로필, /}).click();
check('profile dialog',await page.getByRole('dialog',{name:'프로필'}).isVisible());
await page.getByRole('button',{name:'확인',exact:true}).click();
await page.getByRole('button',{name:'출석',exact:true}).click();
check('unfinished action explains status',(await page.getByRole('dialog').textContent()).includes('준비 중'));
await page.keyboard.press('Escape');
await page.getByRole('button',{name:/메인 수조/}).click();
check('tank routes to farm',await page.locator('.sheet[aria-label="사육"]').isVisible());
await page.locator('.tabbar button').filter({has:page.getByText('샵',{exact:true})}).click();
await page.locator('.card.complete').click();
check('completed card opens results',await page.getByRole('navigation',{name:'원정 단계'}).getByRole('button',{name:/결과 수령/}).getAttribute('aria-pressed')==='true');
const now=new Date().toISOString();
const hunterId='11111111-1111-4111-8111-111111111111';
const player={id:'22222222-2222-4222-8222-222222222222',nickname:'테스트대장',level:12,gold:12450,premium:330,stamina:32,staminaMax:60,staminaNextSec:250,timeTickets:3,shopStage:1};
let me={serverTime:now,player,hunterSlots:1,hunters:[{id:hunterId,name:'카이',skinId:'default',expedition:null}]};
let searches=[];let starts=[];let claims=0;let startFailure=false;let bites=[];let biteAttempts=[];
const region={id:'asia_fresh',nameKo:'아시아 민물',kind:'freshwater',unlockStage:1,requiredLevel:1,requiresTimeTicket:false,specialMapChance:.01,huntSeconds:300,huntStaminaCost:1,unlocked:true};
await page.route('**/v1/**',async route=>{
  const request=route.request();const path=new URL(request.url()).pathname;let body={serverTime:now};
  if(path==='/v1/me')body=me;
  else if(path==='/v1/regions')body={...body,regions:[region,{...region,id:'devonian',nameKo:'데본기',unlocked:false,requiredLevel:35,kind:'ancient'}]};
  else if(path.startsWith('/v1/regions/'))body={...body,region,species:[]};
  else if(path==='/v1/expeditions'&&request.method()==='POST'){
    starts.push({body:request.postDataJSON(),key:request.headers()['idempotency-key']});
    if(startFailure)return route.fulfill({status:400,json:{error:{code:'insufficient_stamina',message:'스태미너가 부족합니다'}}});
    const expedition={id:'33333333-3333-4333-8333-333333333333',hunterId,regionId:'asia_fresh',status:'active',repeatDone:0,repeatTotal:10,endsAt:new Date(Date.now()+300000).toISOString(),waitingForStamina:false,stopReason:null,pendingBites:0,claimable:false,result:null};
    me.hunters[0].expedition=expedition;searches=[expedition];body={...body,expeditionId:expedition.id};
  }else if(path==='/v1/expeditions')body={...body,expeditions:searches};
  else if(path.endsWith('/claim')||path.endsWith('/claim-all')){claims++;body={...body,claimed:{fishIds:['fish'],gold:100,premium:1,exp:10,items:[]},hasMore:false};searches=[];me.hunters[0].expedition=null;}
  else if(path==='/v1/bites')body={...body,bites};
  else if(path==='/v1/encounters')body={...body,encounters:[]};
  else if(path.includes('/bites/')&&path.endsWith('/attempt')){biteAttempts.push(request.postDataJSON());bites=[];body={...body,attempt:{attemptNo:1,success:true,chance:.8,gearConsumed:false,releaseReason:null},bite:{id:'bite-1',status:'caught',attemptsUsed:1,attemptsMax:3,fishId:'fish-1',chances:null}};}
  await route.fulfill({json:body});
});
await page.evaluate(async me=>{const {useGameStore}=await import('/src/store.ts');useGameStore.getState().setTab('shop');useGameStore.getState().setMe(me);useGameStore.getState().setPhase('ready');},me);
await page.locator('.tabbar button').filter({has:page.getByText('원정',{exact:true})}).click();
await page.getByRole('navigation',{name:'원정 단계'}).getByRole('button',{name:/지역 선택/}).click();
await page.getByRole('combobox',{name:'헌터',exact:true}).locator('option').first().waitFor({state:'attached'});
await page.getByRole('spinbutton',{name:'반복 횟수',exact:true}).fill('0');
await page.getByRole('button',{name:'수색 시작',exact:true}).click();
check('invalid repeat blocked',starts.length===0);
await page.getByRole('button',{name:'10',exact:true}).click();
startFailure=true;
await page.getByRole('button',{name:'수색 시작',exact:true}).click();
await page.getByRole('alert').filter({hasText:'스태미너가 부족합니다'}).waitFor();
check('start API error displayed',true);
startFailure=false;
await page.getByRole('button',{name:'수색 시작',exact:true}).dblclick();
await page.locator('.expedition-status').waitFor();
check('successful start opens progress',await page.getByRole('navigation',{name:'원정 단계'}).getByRole('button',{name:/진행 현황/}).getAttribute('aria-pressed')==='true');
check('double click only one start',starts.length===2,starts);
check('start idempotency key',!!starts[1]?.key);
check('progress data',await page.locator('.expedition-status').getByText(/0\/10회/).count()===1);
me.hunters[0].expedition.status='completed';me.hunters[0].expedition.repeatDone=10;searches[0].claimable=true;searches[0].result={catches:[{count:2}],gold:100,premium:1,items:[]};
await page.getByRole('button',{name:'상태 새로고침'}).click();
await page.getByRole('navigation',{name:'원정 단계'}).getByRole('button',{name:/결과 수령/}).click();
await page.getByRole('button',{name:'이 원정 수령'}).waitFor();
check('result reward display',await page.getByText(/물고기 2마리 · 골드 100/).count()===1);
await page.getByRole('button',{name:'이 원정 수령'}).click();
await page.getByRole('status').filter({hasText:/수령/}).first().waitFor();
check('claim executed',claims===1);
bites=[{id:'bite-1',expeditionId:'33333333-3333-4333-8333-333333333333',speciesId:'fish-1',rarity:'rare',expiresAt:new Date(Date.now()+1800000).toISOString(),attemptsUsed:0,attemptsMax:3,paused:false,chances:[.8,.5,.2],autoChance:.3,gear:[]}];
await page.getByRole('button',{name:'상태 새로고침'}).click();
await page.getByRole('button',{name:'잡기',exact:true}).waitFor();
await page.getByRole('button',{name:'잡기',exact:true}).click();
check('bite game opens',await page.locator('.bite-scene').isVisible());
await page.screenshot({path:'bite-360.png'});
await page.getByRole('button',{name:'지금!',exact:true}).click();
await page.getByRole('button',{name:'돌아가기',exact:true}).waitFor();
check('bite attempt payload',biteAttempts.length===1&&biteAttempts[0].attemptNo===1&&biteAttempts[0].position>=0&&biteAttempts[0].position<=1,biteAttempts);
await page.getByRole('button',{name:'돌아가기',exact:true}).click();
check('bite game closes',await page.locator('.bite-scene').count()===0);
check('no runtime errors',errors.length===0,errors);
await fs.writeFile('report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
