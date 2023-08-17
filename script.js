
const form=document.querySelector('.form');
const inputClient=document.querySelector('.form__input--client');
const inputDate=document.querySelector('.form__input--date');
const inputDuration=document.querySelector('.form__input--duration');
const inputTime=document.querySelector('.form__input--time');
const containermeetings=document.querySelector('.meetings');
const deleteBtn=document.querySelector('.delete');
let map,mapEvent;

class Meeting{
    id = (Date.now() + ' ').slice(-10);
    constructor(coords,client,date,time,duration)
    {
        this.coords=coords;
        this.client=client;
        this.time=time;
        this.duration=duration;
        this._createMarker();
        this._dateFormat(date);
        this._setDescription();
    }
    _setDescription()
    {
        this.description=`Meeting with ${this.client} on ${this.date}`;
    }
    _createMarker()
    {
      this.marker=L.marker(this.coords);
    }
    _dateFormat(date)
    {
        let opera1 = date.split('/');
        let opera2 = date.split('-');
        let lopera1 = opera1.length;
        let lopera2 = opera2.length;
        let pdate;
 
        if (lopera1>1)
        {
             pdate = date.split('/');
        }
        else if (lopera2>1)
        {
             pdate = date.split('-');
        }
        if(pdate[0].length==1)
           this.date=`0${pdate[0]}/`;
        else
           this.date=`${pdate[0]}/`;
        if(pdate[1].length==1)
           this.date+=`0${pdate[1]}/`;
        else
          this.date+=`${pdate[1]}/`;
        this.date+=`${pdate[2]}`;
    }
}


const validDate=function(date)
  {
  let dateformat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
  // Match the date format through regular expression
  if(date.match(dateformat))
  {
  //Test which seperator is used '/' or '-'
  let opera1 = date.split('/');
  let opera2 = date.split('-');
  let lopera1 = opera1.length;
  let lopera2 = opera2.length;
  let pdate;
  // Extract the string into month, date and year
  if (lopera1>1)
  {
     pdate = date.split('/');
  }
  else if (lopera2>1)
  {
     pdate = date.split('-');
  }
  let dd = parseInt(pdate[0]);
  let mm  = parseInt(pdate[1]);
  let yy = parseInt(pdate[2]);
  // Create list of days of a month [assume there is no leap year by default]
  let ListofDays = [31,28,31,30,31,30,31,31,30,31,30,31];
  if (mm==1 || mm>2)
  {
    if (dd>ListofDays[mm-1])
    {
      alert('Invalid date format!(dd/mm/yyyy)');
      return false;
    }
  }
  if (mm==2)
  {
     let lyear = false;
     if ( (!(yy % 4) && yy % 100) || !(yy % 400)) 
     {
       lyear = true;
     }
     if ((lyear==false) && (dd>=29))
     {
       alert('Invalid date format!(dd/mm/yyyy)');
       return false;
     }
     if ((lyear==true) && (dd>29))
     {
       alert('Invalid date format!(dd/mm/yyyy)');
       return false;
     }
  }
  }
  else
  {
    alert('Invalid date format(dd/mm/yyyy)');
    return false;
  }
  return true;
  }
  const validTime=function (time) {
    
    // time in 24-hour format
    let timeFormat = /^([01][0-9]|2[0-3]):?([0-5][0-9])$/;
   
    if (time.match(timeFormat)) {
        return true;
    }
    else {
        alert('Invalid time (HH:MM {24-hour format})');
        return false;
    }
}

const inputValid=function(date,time,duration){
    if(!Number.isFinite(duration) || duration<0)
    {
        alert('Invalid duration');
        return false;
    }
    if(!validDate(date))
       return false;
    if(!validTime(time))
       return false;
    return true;
}
//application architecture
class App{
    #map;
    #mapEvent;
    #meetings=[];
    #mapZoomLevel=13;
    //page loads
    constructor(){
        this._getPosition();
        this._getLocalStorage();
        form.addEventListener('submit',this._newMeeting.bind(this));
        containermeetings.addEventListener('click',this._moveToPopup.bind(this));
    }

    _getPosition(){
        if(navigator.geolocation)
        {
            navigator.geolocation.getCurrentPosition(
              this._loadMap.bind(this), function()
                {
                    alert('can\'t get the position');
                }
            );
        }
    }

    _loadMap(position){
        
            const {latitude}=position.coords;
            const {longitude}=position.coords;
            console.log(latitude,longitude);
           let mapOptions = {
             center: [latitude,longitude],
             zoom: 10
          }
          
           this.#map = L.map('map').setView([latitude,longitude], this.#mapZoomLevel);
 
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(this.#map);
         this.#map.on('click',this._showForm.bind(this));  
         
         //render marker from local strorage only after the map loads 
         this.#meetings.forEach(element => {
          this._renderMeetingMarker(element);
      });
    }

    _showForm(mapE){
        this.#mapEvent=mapE;
             form.classList.remove('hidden');
             inputClient.focus();
    }

    _hideForm(){
        inputClient.value = inputDuration.value = inputDate.value = inputTime.value =
      '';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
    }

    _newMeeting(e){
       
            e.preventDefault();
            const {lat,lng}=this.#mapEvent.latlng;
            const client=inputClient.value;
            const date=inputDate.value;
            const time=inputTime.value;
            //GET DATA FROM FORM
            //+ in starting convert into number
            const duration=+inputDuration.value;
            let meeting;
            //CHECK IF DATA IS VALID
             if(!inputValid(date,time,duration))
             {
                return;
             }
            //CREATE A MEETING
            meeting=new Meeting([lat,lng],client,date,time,duration);

            //ADD NEW OBJECT TO MEETING ARRAY
            this.#meetings.push(meeting);

            //RENDER MEETING ON MAP AS MARKER
             this._renderMeetingMarker(meeting);

            //RENDER MEETING ON LIST
            this._renderMeeting(meeting);

            //HIDE FORM AND CLEAR INPUT
            this._hideForm();

            // //SET LOCAL STORAGE
            this._setLocalStorage();  
       }
       _renderMeetingMarker(meeting)
       {
        meeting.marker
        .addTo(this.#map)
        .bindPopup(
          L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
        }))
        .setPopupContent(`${meeting.description}`)
        .openPopup();
       }
       _renderMeeting(meeting)
       {
        let html=`<li class="meeting " data-id="${meeting.id}">
        <h2 class="meeting__title">Meeting with ${meeting.client} <button type="button" class="delete">Delete</button></h2>
        <div class="meeting__details">
           <span class="meeting__icon">📆</span>
           <span class="meeting__value">${meeting.date}</span>
        </div>
        <div class="meeting__details">
          <span class="meeting__icon">⌛</span>
          <span class="meeting__value">${meeting.duration}</span>
          <span class="meeting__unit">min</span>
        </div>
        <div class="meeting__details">
          <span class="meeting__icon">⌚</span>
          <span class="meeting__value">${meeting.time}</span>
        </div>
        </li>`
      form.insertAdjacentHTML('afterend', html);
    }

      _setLocalStorage()
      {
        let json=Object.assign({},this.#meetings);
        //i used this replacer function because the JSON.stringify was giving circular datastructure error so got this solution from a documentation
        // where this function was already built
        const replacerFunc = () => {
          const visited = new WeakSet();
          return (key, value) => {
            if (typeof value === "object" && value !== null) {
              if (visited.has(value)) {
                return;
              }
              visited.add(value);
            }
            return value;
          };
        };
        localStorage.setItem('meeting',JSON.stringify(json,replacerFunc()));
      }
      
      _getLocalStorage()
      {
         const data=JSON.parse(localStorage.getItem('meeting'));
         //console.log(data);
         if(!data)
            return;
          //the typeof data would be objects and not meeting because json.parse convert the string into normal object
          //so we can create a new meeting object by traversing through the data
         for(let i in data)
            this.#meetings.push(new Meeting(data[i].coords,data[i].client,data[i].date,data[i].time,data[i].duration));
          this.#meetings.forEach(element => {
              this._renderMeeting(element);
          });
      }

       _moveToPopup(e){
        console.log(e.target);
        const meetingEl=e.target.closest('.meeting');
        //check if button clicked is delete, this is done because of bubbling effect
        if(e.target.closest('.delete'))
        {
           let i=0;
           for(let work in this.#meetings)
           {
              if(this.#meetings[work].id===meetingEl.dataset.id)
                  i=work;
           }
           //delete the marker
           this.#map.removeLayer(this.#meetings[i].marker);
           //delete data from meeting array
           this.#meetings.splice(i,1);
           //remove from html document
           meetingEl.remove();
           this._setLocalStorage();
        }
        else
        {
          if(!meetingEl)
             return;
          const meeting=this.#meetings.find(work=>work.id===meetingEl.dataset.id);
          this.#map.setView(meeting.coords,this.#mapZoomLevel,{
            animate:true,
            pan:{
              duration:1
            }
          });
        }
       }
  
       _
}

const app=new App();
