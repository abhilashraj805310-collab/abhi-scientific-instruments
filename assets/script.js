/* Abhi Scientific Instruments - site interactions */
const menuBtn=document.querySelector('.menu'), navLinks=document.querySelector('.navlinks');
if(menuBtn && navLinks) menuBtn.addEventListener('click',()=>navLinks.classList.toggle('open'));

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting) entry.target.classList.add('show');});
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

document.querySelectorAll('.counter').forEach(el=>{
  let done=false, target=Number(el.dataset.target||0);
  const counterObserver=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&!done){
      done=true; let value=0;
      const timer=setInterval(()=>{
        value=Math.min(target,value+Math.max(1,Math.ceil(target/40)));
        el.textContent=value+(el.dataset.suffix||'');
        if(value>=target) clearInterval(timer);
      },25);
    }
  });
  counterObserver.observe(el);
});
