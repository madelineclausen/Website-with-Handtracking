import { Component, ElementRef, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import * as handTrack from 'handtrackjs';
import { PredictionEvent } from '../prediction-event';

@Component({
  selector: 'app-handtracker',
  templateUrl: './handtracker.component.html',
  styleUrls: ['./handtracker.component.css']
})
export class HandtrackerComponent implements OnInit {
  @Output() onPrediction = new EventEmitter<PredictionEvent>();
  @ViewChild('htvideo') video: ElementRef;
  
  /* 
  SAMPLERATE determines the rate at which detection occurs (in milliseconds)
  500, or one half second is about right, but feel free to experiment with faster
  or slower rates
  */
  SAMPLERATE: number = 100; 
  breakfast:Boolean = false;
  lunch:Boolean = false;
  dinner:Boolean = false;
  drink:Boolean = false;
  dessert:Boolean = false;
  snack:Boolean = false;
  results:Boolean = false;
  detectedGesture:string = "None"
  idaho:number = 0;
  california:number = 0;
  newYork:number = 0;
  florida:number = 0;
  answer:string = "";
  lastGesture:string = "None"
  width:string = "400"
  height:string = "400"
  private predict_event:PredictionEvent;
  private model: any = null;
  private runInterval: any = null;

  //handTracker model
  private modelParams = {
    flipHorizontal: true, // flip e.g for video
    maxNumBoxes: 20, // maximum number of boxes to detect
    iouThreshold: 0.5, // ioU threshold for non-max suppression
    scoreThreshold: 0.6, // confidence threshold for predictions.
  };

  constructor() {
  }
  
  ngOnInit(): void{
    handTrack.load(this.modelParams).then((lmodel: any) =>{
        this.model = lmodel;
        console.log("loaded");
    });
  }

  ngOnDestroy(): void{
      this.model.dispose();
  }

  startVideo(): Promise<any> {
    return handTrack.startVideo(this.video.nativeElement).then(function(status: any){
        return status;
    }, (err: any) => { return err; }) 
  }

  startDetection(){
    this.breakfast = true;
    this.startVideo().then(()=>{
        //The default size set in the library is 20px. Change here or use styling
        //to hide if video is not desired in UI.
        this.video.nativeElement.style.height = "200px"

        console.log("starting predictions");
        this.runInterval = setInterval(()=>{
            this.runDetection();
        }, this.SAMPLERATE);
    }, (err: any) => { console.log(err); });
  }

  stopDetection(){
    console.log("stopping predictions");
    clearInterval(this.runInterval);
    handTrack.stopVideo(this.video.nativeElement);
  }

  clearBoard()
  {
    this.stopDetection();
    this.breakfast = false;
    this.lunch = false;
    this.dinner = false;
    this.drink = false;
    this.dessert = false;
    this.snack = false;
    this.results = false;
    this.idaho = 0;
    this.california = 0;
    this.newYork = 0;
    this.florida = 0;
    this.answer = "";
    this.lastGesture = "None"
  }

  theResult()
  {
    if (this.california > this.idaho && this.california > this.florida && this.california > this.newYork){
      this.answer = "California"

    }
    else if(this.idaho > this.california && this.idaho > this.florida && this.idaho > this.newYork){
      this.answer = "Idaho"

    }else if(this.florida > this.california && this.florida > this.idaho && this.florida>this.newYork ) {
      this.answer = "Florida"
    }else{
      this.answer = "New York"
    }
  }

  showQuestion()
  {
    if (this.lastGesture != "Hand Pinching")
    {
      if (this.breakfast == true && this.lunch == false)
      {
        this.lunch = true;
      }
      else if (this.lunch == true && this.dinner == false)
      {
        this.dinner = true;
      }
      else if (this.dinner == true && this.drink == false)
      {
        this.drink = true;
      }
      else if (this.drink == true && this.dessert == false)
      {
        this.dessert = true;
      }
      else if (this.dessert == true && this.snack == false)
      {
        this.snack = true;
      }
      else if (this.snack == true && this.results == false)
      {
        this.results = true;
      }
    }
  }

  getNextQuestion(detectedGesture:string){
    if (detectedGesture == "Open Hand")
    {
      this.california++;
    }
    else if (detectedGesture == "Two Open Hands")
    {
      this.idaho++;
    }
    else if (detectedGesture == "Closed Hand")
    {
      this.florida++;
    }
    else if (detectedGesture == "Two Closed Hands")
    {
      this.newYork++;
    }
  }

  /*
    runDetection demonstrates how to capture predictions from the handTrack library.
    It is not feature complete! Feel free to change/modify/delete whatever you need
    to meet your desired set of interactions
  */
  runDetection(){
    if (this.model != null){
        let predictions = this.model.detect(this.video.nativeElement).then((predictions: any) => {
            if (predictions.length <= 0) return;
            
            let openhands = 0;
            let closedhands = 0;
            let pointing = 0;
            let pinching = 0;
            for(let p of predictions){
                //uncomment to view label and position data
                //console.log(p.label + " at X: " + p.bbox[0] + ", Y: " + p.bbox[1] + " at X: " + p.bbox[2] + ", Y: " + p.bbox[3]);
                
                if(p.label == 'open') openhands++;
                if(p.label == 'closed') closedhands++;
                if(p.label == 'point') pointing++;
                if(p.label == 'pinch') pinching++;
                
            }

            // These are just a few options! What about one hand open and one hand closed!?

            if (openhands > 1)
            {
              this.detectedGesture = "Two Open Hands";
              this.getNextQuestion(this.detectedGesture);
            }
            else if(openhands == 1 && pinching == 1) 
            {
              this.detectedGesture = "Open Hand and Hand Pinching";
              this.clearBoard();
            }
            else if(openhands == 1 && pinching == 0)
            {
              this.detectedGesture = "Open Hand";
              this.getNextQuestion(this.detectedGesture);
            } 
            if (closedhands > 1)
            {
               this.detectedGesture = "Two Closed Hands";
               this.getNextQuestion(this.detectedGesture);
            }
            else if(closedhands == 1 && pointing == 1)
            {
               this.detectedGesture = "Closed Hand and Hand Pointing";
               this.theResult();
            }
            else if(closedhands == 1 && pointing == 0)
            {
               this.detectedGesture = "Closed Hand";
               this.getNextQuestion(this.detectedGesture);
            }
            if (pointing > 1)
            {
              this.detectedGesture = "Two Hands Pointing";
            } 
            else if(pointing == 1)
            {
              this.detectedGesture = "Hand Pointing";
            } 
            if (pinching > 1)
            {
              this.detectedGesture = "Two Hands Pinching";
            } 
            else if(pinching == 1)
            {
              this.detectedGesture = "Hand Pinching";
              this.showQuestion();
            } 
            if (openhands == 0 && closedhands == 0 && pointing == 0 && pinching == 0)
            {
              this.detectedGesture = "None";
            }
            this.lastGesture = this.detectedGesture;
            this.onPrediction.emit(new PredictionEvent(this.detectedGesture))
        }, (err: any) => {
            console.log("ERROR")
            console.log(err)
        });
    }else{
        console.log("no model")
    }
  }
}
