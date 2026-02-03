/**
 * Player HTML template generator - fixed with correct class names
 */
export class PlayerTemplate
{
  /**
   * Generate complete player HTML structure with correct classes
   */
  static generate = (): string => `
    <div class="player">
      <!-- Main Icons (like in original) -->
      <em class="fas fa-pause player__main-icon j-pause"></em>
      <em class="fas fa-play player__main-icon j-play"></em>

      <!-- Video Element -->
      <video class="player__video"></video>

      <!-- Source Navigation Buttons -->
      <button class="player__source-nav player__source-nav--prev j-source-prev" title="Previous source">
        <em class="fas fa-chevron-left fa-lg"></em> <!-- fa-lg for slightly larger icons -->
      </button>
      <button class="player__source-nav player__source-nav--next j-source-next" title="Next source">
        <em class="fas fa-chevron-right fa-lg"></em> <!-- fa-lg for slightly larger icons -->
      </button>

      <!-- Control Panel -->
      <div class="player__panel">
        <!-- Timeline -->
        <div class="player__lines j-line">
          <div class="player__hint j-hint"></div>
          <div class="player__line player__line--current j-line-current"></div>
          <div class="player__line player__line--ghost j-line-ghost"></div>
          <div class="player__line player__line--full"></div>
        </div>

        <!-- Left Controls -->
        <div class="player__panel-block">
          <!-- Skip Backward Control -->
          <button class="player__panel-button j-skip-backward" title="Skip backward 5s">
            <em class="fas fa-backward"></em>
          </button>
          
          <!-- File Open Control -->
          <button class="player__panel-button j-open-file" title="Open video file">
            <em class="fas fa-folder-open"></em>
          </button>
          
          <!-- Loop Control -->
          <button class="player__panel-button j-toggle-loop" title="Loop video">
            <svg class="loop-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <g class="loop-icon__group">
                <path class="loop-icon__number" fill-rule="evenodd" d="M12.475 9.132a.9.9 0 0 1 .429.766V14.1a.9.9 0 0 1-1.8 0v-2.74a.9.9 0 0 1-.807-1.609l1.3-.656a.9.9 0 0 1 .878.037" clip-rule="evenodd"></path>
                <path class="loop-icon__arrows" d="M2.005 12c0-3.258 2.642-5.9 5.902-5.9h10.026l-.564-.564a.9.9 0 1 1 1.273-1.272l2.1 2.1a.9.9 0 0 1 0 1.272l-2.1 2.1a.9.9 0 0 1-1.273-1.272l.564-.564H7.907A4.1 4.1 0 0 0 3.805 12v.097a.9.9 0 0 1-1.8 0zM21.104 11.003a.9.9 0 0 1 .9.9V12c0 3.259-2.642 5.9-5.902 5.9H6.074l.564.564a.9.9 0 1 1-1.273 1.272l-2.101-2.1a.9.9 0 0 1 0-1.272l2.1-2.1a.9.9 0 0 1 1.274 1.272l-.564.564h10.029a4.1 4.1 0 0 0 4.101-4.1v-.097a.9.9 0 0 1 .9-.9"></path>
              </g>
            </svg>
          </button>
          
          <!-- Play Control -->
          <button class="player__panel-button j-toggle-video" title="Play/Pause">
            <em class="fas fa-play"></em>
          </button>
          
          <!-- Skip Forward Control -->
          <button class="player__panel-button j-skip-forward" title="Skip forward 5s">
            <em class="fas fa-forward"></em>
          </button>

          <!-- Volume Control -->
          <button class="player__panel-button player__panel-button--volume j-toggle-volume" title="Volume">
            <em class="fas fa-volume-up player__volume-icon"></em>
            <input type="range" class="player__volume j-volume-input">
          </button>

          <span class="j-duration">0:00 / 0:00</span>
        </div>

        <div class="player__panel-block">
          <!-- Speed Control -->
          <div class="player__panel-playback-content">
            <button class="player__panel-button j-speed" title="Playback speed">
              <span class="material-symbols-rounded">slow_motion_video</span>
            </button>
            <ul class="player__panel-speed-options j-speed-options">
              <li data-speed="2">2x</li>
              <li data-speed="1.5">1.5x</li>
              <li data-speed="1" class="active">Normal</li>
              <li data-speed="0.75">0.75x</li>
              <li data-speed="0.5">0.5x</li>
            </ul>
          </div>

          <!-- Picture in Picture -->
          <button class="player__panel-button j-pic-in-pic" title="Picture in Picture">
            <span class="material-icons">picture_in_picture_alt</span>
          </button>

          <!-- Fullscreen -->
          <button class="player__panel-button j-fullscreen" title="Fullscreen">
            <em class="fas fa-expand"></em>
          </button>
        </div>
      </div>
    </div>`
}
