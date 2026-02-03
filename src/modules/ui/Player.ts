/**
 * Player HTML template generator
 */
export class Player
{
  /**
   * Generate complete player HTML structure with containers for components
   */
  static generate(): string
  {
    return `
      <div class="player">
        <em class="fas fa-pause player__main-icon j-pause"></em>
        <em class="fas fa-play player__main-icon j-play"></em>
        
        <video class="player__video"></video>
        
        <div class="source-navigation-container"></div>
        
        <div class="player__panel">
          <div class="player__lines j-line"></div>
          <div class="control-panel-container"></div>
        </div>
      </div>`
  }
}
