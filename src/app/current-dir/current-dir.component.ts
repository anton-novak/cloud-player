import { Component, OnInit, ViewChild, ElementRef, OnChanges, SimpleChanges, Input } from '@angular/core';
import { TrackServerService } from '../track-server.service';
import { Track } from '../track-server.service';

@Component({
  selector: 'app-current-dir',
  templateUrl: './current-dir.component.html',
  styleUrls: ['./current-dir.component.css']
})
export class CurrentDirComponent implements OnInit, OnChanges {
  constructor(public trackService: TrackServerService) { }
  @ViewChild("rootDir") rootDirForm!: ElementRef;

  // TODO: REFACTOR AS currentDir IS ALSO ALLOWED TO DISPLAY FOLDERS 
  // SO Track TYPE IS NOT ENTIRELY CORRECT
  @Input()
  currentDirContents: Track[] = [];

  addToQueue(track: Track): void {
    if (track.mimeType.slice(0, 5) === "audio") {
      this.trackService.playbackQueue.push(track);
      this.trackService.queueAlert.emit();
    }
  }

  // IT IS ACTUALLY A DIRECTORY, NOT A TRACK BUT IT HAS THE id I NEED
  goToDir(file: Track | null, direction: string): void {
    this.currentDirContents = [];
    if (file !== null && direction === "down") {
      this.trackService.previousDirIds.push(this.trackService.dirId);
      this.trackService.dirId = file.id;
      this.trackService.getDirectoryContents(file.id)
        .subscribe((response) => {
          this.processChildren(response.items);
        })
    } else if (direction === "up") {
      const prev = this.trackService.previousDirIds.pop() as string;
      this.trackService.dirId = prev;
      this.trackService.getDirectoryContents(prev)
        .subscribe((response) => {
          this.processChildren(response.items);
        })
    }
  }

  // CHILDREN ARE CONTENTS OF A FOLDER IN GOOGLE DRIVE
  // BY DEFAULT THEY HAVE NO FILENAME WHICH HAS TO BE REQUESTED SEPARATELY
  processChildren(children: []): void {
    if (children.length === 0) {
      this.trackService.currentDirContents = [];
      this.currentDirContents = this.trackService.currentDirContents;
    }
    children.forEach((child) => {
      this.trackService.getTrackObject(child["id"]);
    })
    // TODO: FIGURE OUT HOW TO SORT FILES BY NAME - HELP REQUEST?
    this.currentDirContents = this.trackService.currentDirContents;
  }

  handleSubmit(): void {
    this.trackService.findDirectoryId(this.rootDirForm.nativeElement.value)
      .subscribe((response) => {
        try {
        this.rootDirForm.nativeElement.disabled = true;
        console.log(response.files[0].id);
        const rootDirId = response.files[0].id;
        this.trackService.rootDirId = rootDirId;
        this.trackService.dirId = rootDirId;
        this.trackService.getDirectoryContents(rootDirId)
          .subscribe((response) => {
            this.processChildren(response.items)
          })
        } catch {
          window.alert('Directory not found on Google Drive!');
          this.rootDirForm.nativeElement.disabled = false;
        }
      })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDirContents']) {
      console.log('detected');
    }
  }

  ngOnInit(): void {
    // MVP CODE FOR CUSTOM SERVER
    // this.trackService.getDirectory()
    //   .subscribe((response) => {
    //     console.log(response);
    //     this.processChildren(response.items);
    //   });
  }
}
