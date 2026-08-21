const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const notes = [
  {f:262,d:.5,t:"Hap",p:p1},
  {f:262,d:.5,t:"py&nbsp;",p:p1},
  {f:294,d:1,t:"Birth",p:p1},
  {f:262,d:1,t:"day&nbsp;",p:p1},
  {f:349,d:1,t:"To&nbsp;",p:p1},
  {f:330,d:2,t:"You",p:p1},
  
  {f:262,d:.5,t:"Hap",p:p2},
  {f:262,d:.5,t:"py&nbsp;",p:p2},
  {f:294,d:1,t:"Birth",p:p2},
  {f:262,d:1,t:"day&nbsp;",p:p2},
  {f:392,d:1,t:"To&nbsp;",p:p2},
  {f:349,d:2,t:"You",p:p2},
  
  {f:262,d:.5,t:"Hap",p:p3},
  {f:262,d:.5,t:"py&nbsp;",p:p3},
  {f:523,d:1,t:"Birth",p:p3},
  {f:440,d:1,t:"day&nbsp;",p:p3},
  {f:349,d:1,t:"Dear&nbsp;",p:p3},
  {f:330,d:1,t:"Mei",p:p3},
  {f:294,d:3,t:"ke",p:p3},
  
  {f:466,d:.5,t:"Hap",p:p4},
  {f:466,d:.5,t:"py&nbsp;",p:p4},
  {f:440,d:1,t:"Birth",p:p4},
  {f:349,d:1,t:"day&nbsp;",p:p4},
  {f:392,d:1,t:"To&nbsp;",p:p4},
  {f:349,d:2,t:"You",p:p4},
];

//DOM
notes.map((n) => createSpan(n));

function createSpan(n){
  n.sp = document.createElement("span");
  n.sp.innerHTML = n.t;
  n.p.appendChild(n.sp);
}

// RECORDING TIMINGS

let start_at = 1000; // ms
let stop_at = 16000; // ms


// SOUND
let speed = 0.5;
let flag = false;
let sounds = [];

class Sound{
  constructor(freq,dur,i){
    this.stop = true;
    this.frequency = freq;// la frecuencia
    this.waveform = "triangle";// la forma de onda
    this.dur = dur;// la duración en segundos
    this.speed = this.dur*speed;
    this.initialGain = .15;
    this.index = i;
    this.sp = notes[i].sp
  }
  
  cease(){
    this.stop = true;
    this.sp.classList.remove("jump");
    //this.sp.style.animationDuration = `${this.speed}s`;
    if(this.index < sounds.length-1){sounds[this.index+1].play();}
    if(this.index == sounds.length-1){flag = false;}
  }
  
  play(){
   // crea un nuevo oscillator
   this.oscillator = audioCtx.createOscillator();
   // crea un nuevo nodo de ganancia 
   this.gain = audioCtx.createGain();
   // establece el valor inicial del volumen del sonido 
   this.gain.gain.value = this.initialGain;
   // establece el tipo de oscillator  
   this.oscillator.type = this.waveform;
   // y el valor de la frecuencia 
   this.oscillator.frequency.value = this.frequency;
   // el volumen del sonido baja exponencialmente     
   this.gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + this.speed);
   // conecta el oscillator con el nodo de ganancia 
   this.oscillator.connect(this.gain);
   // y la ganancia con el dispositivo de destino
   this.gain.connect(audioCtx.destination);
   // inicia el oscillator 
   this.oscillator.start(audioCtx.currentTime);
   this.sp.setAttribute("class", "jump");
   this.stop = false;
   // para el oscillator después de un tiempo (this.speed) 
   this.oscillator.stop(audioCtx.currentTime + this.speed); 
   this.oscillator.onended = ()=> {this.cease();}
  }  
}

for(let i=0; i < notes.length; i++){
  let sound = new Sound(notes[i].f, notes[i].d,i);
  sounds.push(sound);
}


// EVENTS  // Replace with record button!
// wishes.addEventListener("click",function(e){
//   if(e.target.id != "inputSpeed" && !flag){
//   sounds[0].play();
//   flag = true;}
//   },false);
                        


// Video recording

/* JSHint inline rules */
/* jshint node: true, browser: true */
/* globals QBMediaRecorder, Promise */

'use strict';

var rec;

var notify = {
    ui: document.querySelector('.j-notify'),
    hide: function() {
        this.ui.classList.remove('notify-active');
    },
    show: function(txt) {
        var n = this;

        n.ui.textContent = txt;
        n.ui.classList.add('notify-active');

        var timerId = setTimeout(function() {
            n.hide();
        }, 5000);
    }
};

var resultCard = {
    blob: null, // saved a blob after stopped a record
    ui: {
        wrap: document.querySelector('.j-result-card'),
        video: document.querySelector('.j-video_result'),
        clear: document.querySelector('.j-clear'),
        download: document.querySelector('.j-download')
    },
    toggleBtn: function(state) {
        this.ui.clear.disabled = state;
        this.ui.download.disabled = state;
    },
    attachVideo: function(blob) {
        this.ui.video.src = URL.createObjectURL(blob);

        this.ui.clear.disabled = false;
        this.ui.download.disabled = false;
    },
    detachVideo: function() {
        this.blob = null;
        this.ui.video.src = '';

        this.ui.clear.disabled = true;
        this.ui.download.disabled = true;
    },
    setupListeners: function(rec) {
        var self = this;

        var evClear = new CustomEvent('clear');
        var evDownload = new CustomEvent('download');

        self.ui.clear.addEventListener('click', function() {
            self.ui.video.pause();
            self.detachVideo();
            
            self.ui.wrap.dispatchEvent(evClear);
        });
        
        self.ui.download.addEventListener('click', function() {
            self.ui.wrap.dispatchEvent(evDownload);
        });
    }
};

var inputCard = {
    audioRecorderWorkerPath: '../../js/qbAudioRecorderWorker.js',
    stream: null,
    devices: {
        audio: [],
        video: []
    },
    ui: {
        wrap: document.querySelector('.j-card'),
        video: document.querySelector('.j-video_local'),

        start: document.querySelector('.j-start'),
        stop: document.querySelector('.j-stop'),
        pause: document.querySelector('.j-pause'),
        resume: document.querySelector('.j-resume'),

        selectAudioSource: document.getElementById('j-audioSource'),
        selectVideoSource: document.getElementById('j-videoSource'),
        selectMimeTypeFormats: document.getElementById('j-mimeTypes')
    },
    _createOptions: function(type) {
        var docfrag = document.createDocumentFragment();

        /* create a default option */
        var optDef = document.createElement('option');
            optDef.textContent = `Choose an input ${type}-device`;
            optDef.value = 'default';

        docfrag.appendChild(optDef);

        /* create a options with available sources */
        this.devices[type].forEach(function(device, index) {
            var option = document.createElement('option');

            option.value = device.deviceId;
            option.textContent = device.label || `${index + 1} ${type} source`;

            docfrag.appendChild(option);
        });

        /* create a option which off a type a media */
        var optOff = document.createElement('option');
        optOff.textContent = `Off ${type} source`;
        optOff.value = 0;

        docfrag.appendChild(optOff);

        return docfrag;
    },
    _createMimeTypesOptions: function(mimeTypes) {
        var docfrag = document.createDocumentFragment();

        mimeTypes.forEach(function(mimeType) {
            var option = document.createElement('option');

            option.value = mimeType;
            option.textContent = mimeType;

            if (mimeType.includes('video')) {
                option.classList.add('j-videoMimeType');
            } else {
                option.classList.add('j-audioMimeType');
                option.disabled = true;
            }

            docfrag.appendChild(option);
        });

        return docfrag;
    },
    _processDevices: function(devices) {
        var self = this;

        var docfragAudio = document.createDocumentFragment(),
            docfragVideo = document.createDocumentFragment();

        devices.forEach(function(device) {
            if(device.kind.indexOf('input') !== -1) {
                if(device.kind === 'audioinput') {
                    /* set audio source to collection */
                    self.devices.audio.push(device);
                }

                if(device.kind === 'videoinput') {
                    /* set video source to collection */
                    self.devices.video.push(device);
                }
            }
        });

        if(self.devices.audio.length > 0) {
            self.ui.selectAudioSource.appendChild( self._createOptions('audio') );
            self.ui.selectAudioSource.classList.remove('invisible');
        }

        if(self.devices.video.length > 0) {
            self.ui.selectVideoSource.appendChild( self._createOptions('video') );
            self.ui.selectVideoSource.classList.remove('invisible');
        }

        if(QBMediaRecorder.getSupportedMimeTypes().length) {
            var audioMimeTypes = QBMediaRecorder.getSupportedMimeTypes("audio"),
                videoMimeTypes = QBMediaRecorder.getSupportedMimeTypes("video"),
                allMimeTypes = videoMimeTypes.concat(audioMimeTypes);

            self.ui.selectMimeTypeFormats.appendChild( self._createMimeTypesOptions(allMimeTypes) );
            self.ui.selectMimeTypeFormats.classList.remove('invisible');
        }
    },
    getDevices: function() {
        var self = this;

        navigator.mediaDevices.enumerateDevices()
            .then(function(devices) {
                 self._processDevices(devices);
            })
    },
    attachStreamToSource: function() {
        this.ui.video.pause();

        try {
          this.ui.video.srcObject = null;
          this.ui.video.srcObject = this.stream;
        } catch (error) {
          this.ui.video.src = '';
          this.ui.video.src = URL.createObjectURL(this.stream);
        }

        this.ui.video.play();
    },
    getUserMedia: function(attrs) {
        var constraints = attrs || { audio: true, video: true };

        return navigator.mediaDevices.getUserMedia(constraints)
    },
    _getSources: function() {
        var sVideo = this.ui.selectVideoSource,
            sAudio = this.ui.selectAudioSource,
            selectedAudioSource = sAudio.options[sAudio.selectedIndex].value,
            selectedVideoSource = sVideo.options[sVideo.selectedIndex].value;

        var constraints = {};

        if(selectedAudioSource === 'default') {
            constraints.audio = true;
        } else if(selectedAudioSource === '0') {
            constraints.audio = false;
            this._toggleAudioTypesSelect(true);
        } else {
            constraints.audio = {deviceId: selectedAudioSource};
        }

        if(selectedVideoSource === 'default') {
            constraints.video = true;
        } else if(selectedVideoSource === '0') {
            constraints.video = false;
        } else {
            constraints.video = {deviceId: selectedVideoSource};
        }

        this._toggleAudioTypesSelect(constraints.video);
        this._toggleVideoTypesSelect(!constraints.video);

        return constraints;
    },
    _toggleAudioTypesSelect: function(state) {
        var audioTypes = document.getElementsByClassName('j-audioMimeType');

        for (var i = 0; i < audioTypes.length; i++) {
            audioTypes[i].disabled = state;
        }
    },
    _toggleVideoTypesSelect: function(state) {
        var videoTypes = document.getElementsByClassName('j-videoMimeType');

        for (var i = 0; i < videoTypes.length; i++) {
            videoTypes[i].disabled = state;
        }
    },
    _stopStreaming: function() {
        this.stream.getTracks().forEach(function(track) {
            track.stop();
        });
    },
    _setupListeners: function() {
        var self = this;

        var evStart = new CustomEvent('started');
        var evPause = new CustomEvent('paused');
        var evResume = new CustomEvent('resumed');
        var evStop = new CustomEvent('stopped');
        var evChange = new CustomEvent('changed');

        self.ui.start.addEventListener('click', function() {
            self.ui.start.disabled = true;
            self.ui.resume.disabled = true;
            self.ui.stop.disabled = false;
            self.ui.pause.disabled = false;
            self.ui.selectMimeTypeFormats.disabled = true;
            self.ui.wrap.dispatchEvent(evStart);
        });

        self.ui.stop.addEventListener('click', function() {
            self.ui.start.disabled = false;
            self.ui.stop.disabled = true;
            self.ui.pause.disabled = true;
            self.ui.resume.disabled = true;
            self.ui.selectMimeTypeFormats.disabled = false;
            self.ui.wrap.dispatchEvent(evStop);
        });

        self.ui.pause.addEventListener('click', function() {
            self.ui.start.disabled = true;
            self.ui.pause.disabled = true;
            self.ui.resume.disabled = false;
            self.ui.stop.disabled = false;
            self.ui.wrap.dispatchEvent(evPause);
        });

        self.ui.resume.addEventListener('click', function() {
            self.ui.start.disabled = true;
            self.ui.resume.disabled = true;
            self.ui.pause.disabled = false;
            self.ui.stop.disabled = false;
            self.ui.wrap.dispatchEvent(evResume);
        });

        function handleSources() {
            var constrains = self._getSources();
            
            self._stopStreaming();
            self.stream = null;

            self.getUserMedia(constrains).then(function(stream) {
                self.stream = stream;
                self.attachStreamToSource();

                self.ui.wrap.dispatchEvent(evChange);
            });
        }

        function handleRecordMimeType() {
            var sMimeType = self.ui.selectMimeTypeFormats,
                selectedMimeType = sMimeType.options[sMimeType.selectedIndex].value;

            rec.toggleMimeType(selectedMimeType);
        }

        self.ui.selectAudioSource.addEventListener('change', handleSources);
        self.ui.selectVideoSource.addEventListener('change', handleSources);
        self.ui.selectMimeTypeFormats.addEventListener('change', handleRecordMimeType);
    },
    init: function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            self.getUserMedia()
                .then(function(stream) {
                    self.stream = stream;
                    self.attachStreamToSource();
                    self.getDevices();
                    self._setupListeners();

                    resolve();
                }).catch(function(error) {
                    reject(error);
                })
        });
    }
};

/* Start !FUN */
inputCard.init()
    .then(function() {
        initRecorder();
    })
    .catch(function(error) {
        notify.show(`Error: ${error.name}`);
    });

function initRecorder() {
    var opts = {
        onstop: function onStoppedRecording(blob) {
            resultCard.blob = blob;
            resultCard.attachVideo(blob);
        },
        workerPath: inputCard.audioRecorderWorkerPath
    };

    rec = new QBMediaRecorder(opts);

    resultCard.setupListeners();

    inputCard.ui.wrap.addEventListener('started', function() {
        rec.start(inputCard.stream);
        setTimeout(() => {  
          console.log("Start singing!"); 
          if(!flag){
            sounds[0].play();
            flag = true;
          }
        }, start_at); 
        setTimeout(() => {  
          console.log("And stop singing.");
          rec.stop();
          inputCard.ui.start.disabled = false;
          inputCard.ui.stop.disabled = true;
          resultCard.toggleBtn(false);
        }, stop_at);
    }, false);

    inputCard.ui.wrap.addEventListener('paused', function() {
        rec.pause();
    }, false);

    inputCard.ui.wrap.addEventListener('resumed', function() {
        rec.resume();
    }, false);

    inputCard.ui.wrap.addEventListener('changed', function() {
        if (rec.getState() === 'recording') {
            rec.change(inputCard.stream);
        }
    }, false);

    inputCard.ui.wrap.addEventListener('stopped', function() {
        rec.stop();
        resultCard.toggleBtn(false);
    }, false);

    resultCard.ui.wrap.addEventListener('download', function() {
        rec.download(null, resultCard.blob);
    }, false);
}



