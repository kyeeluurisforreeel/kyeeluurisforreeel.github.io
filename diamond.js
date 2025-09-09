var homeBtn = document.getElementById('homeBtn')
var searchBtn = document.getElementById('searchBtn')
var settingsBtn = document.getElementById('settingsBtn')
var settingsPanel = document.getElementById('settings')
var closeSettings = document.getElementById('closeSettings')
var homeView = document.getElementById('home')
var searchView = document.getElementById('search')
var switchEl = document.getElementById('switch')
var knob = document.getElementById('knob')
var switchLabel = document.getElementById('switchLabel')
var engineSel = document.getElementById('engine')
var proxySel = document.getElementById('proxy')
var saveSettings = document.getElementById('saveSettings')

function showHome(){
  homeView.classList.remove('hidden')
  searchView.classList.add('hidden')
}
function showSearch(){
  homeView.classList.add('hidden')
  searchView.classList.remove('hidden')
}
homeBtn.addEventListener('click', showHome)
searchBtn.addEventListener('click', showSearch)
settingsBtn.addEventListener('click', function(){ settingsPanel.style.display='block' })
closeSettings.addEventListener('click', function(){ settingsPanel.style.display='none' })

function loadSettings(){
  var openSetting = localStorage.getItem('diamond_open_about_blank')
  var engine = localStorage.getItem('diamond_search_engine')
  var proxy = localStorage.getItem('diamond_search_proxy')
  if (openSetting === null) openSetting = 'true'
  if (engine === null) engine = 'duckduckgo'
  if (proxy === null) proxy = 'scramjet'
  if (openSetting === 'true'){
    switchEl.classList.add('on')
    knob.style.transform = 'translateX(18px)'
    switchLabel.textContent = 'Enabled'
  } else {
    switchEl.classList.remove('on')
    knob.style.transform = 'translateX(0)'
    switchLabel.textContent = 'Disabled'
  }
  engineSel.value = engine
  proxySel.value = proxy
}

switchEl.addEventListener('click', function(){
  var on = switchEl.classList.toggle('on')
  if (on){
    knob.style.transform = 'translateX(18px)'
    switchLabel.textContent = 'Enabled'
  } else {
    knob.style.transform = 'translateX(0)'
    switchLabel.textContent = 'Disabled'
  }
})

saveSettings.addEventListener('click', function(){
  var on = switchEl.classList.contains('on')
  localStorage.setItem('diamond_open_about_blank', on ? 'true' : 'false')
  localStorage.setItem('diamond_search_engine', engineSel.value)
  localStorage.setItem('diamond_search_proxy', proxySel.value)
  settingsPanel.style.display='none'
})

loadSettings()
