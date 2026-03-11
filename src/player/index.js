import { open, ignore } from './utils'

const VOLUME_ICONS = { up: 'fa-volume-up', down: 'fa-volume-down', off: 'fa-volume-off', mute: 'fa-volume-mute' }
const FULLSCREEN_ICONS = { compress: 'fa-compress', expand: 'fa-expand' }

export class Player
{
  static getRect(el, prop = null)
  {
    const rect = el.getBoundingClientRect()

    return prop ? rect[prop] : rect
  }

  static fixNumber(number)
  {
    return number < 10 ? `0${number}` : `${number}`
  }

  static formatTime(seconds)
  {
    return `${Math.floor(seconds / 60)}:${this.fixNumber(Math.floor(seconds % 60))}`
  }

  constructor(selector)
  {
    this.player = document.querySelector(selector)
    this.video = this.player?.querySelector('video')

    if (!this.player || !this.video) {
      throw new Error('Player or video not found')
    }

    this.initVideoListeners()
    this.initPlayerListeners()
    this.initTimelineListeners()
    this.initPageListeners()
  }

  initVideoListeners()
  {
    this.video.addEventListener('click', this.toggleVideo.bind(this))
    this.video.addEventListener('loadedmetadata', () => {
      this.setVideoDuration()
      this.updateVolumeInput()
    })

    this.video.addEventListener('timeupdate', () => {
      this.setVideoDuration()
      this.toggleInterface()
    })

    this.video.addEventListener('dblclick', this.toggleFullscreen.bind(this))
    this.video.addEventListener('volumechange', this.updateVolumeInput.bind(this))
  }

  initPlayerListeners()
  {
    const speedOptions = this.player.querySelector('.j-speed-options')
    const picInPic = this.player.querySelector('.j-pic-in-pic')

    this.player.addEventListener('fullscreenchange', this.checkFullscreen.bind(this))
    this.player.addEventListener('mousemove', this.checkInterface.bind(this))

    this.player.querySelector('.j-toggle-video')
      .addEventListener(
        'click',
        this.toggleVideo.bind(this)
      )

    this.player.querySelector('.j-skip-backward')
      .addEventListener('click', () => {
        this.video.currentTime -= 5
      })

    this.player.querySelector('.j-skip-forward')
      .addEventListener('click', () => {
        this.video.currentTime += 5
      })

    this.player.querySelector('.j-volume-input')
      .addEventListener(
        'input',
        this.setVolume.bind(this)
      )

    this.player.querySelector('.j-toggle-volume')
      .addEventListener('click', () => {
        this.video.volume = Number(this.video.volume !== 1)
      })

    this.player.querySelector('.j-speed span')
      .addEventListener('click', () => {
        speedOptions.classList.toggle('show')
      })

    speedOptions.querySelectorAll('li')
      .forEach(option => {
        option.addEventListener('click', () => {
          this.video.playbackRate = option.dataset.speed
          speedOptions.querySelector('.active').classList.remove('active')
          option.classList.add('active')
        })
      })

    picInPic.addEventListener('click', async () => {
      picInPic.disabled = true

      try {

        this.video !== document.pictureInPictureElement
          ? await this.video.requestPictureInPicture()
          : await document.exitPictureInPicture()

      } catch (e) {
      }

      picInPic.disabled = false
    })

    this.video.addEventListener('leavepictureinpicture', () => {
      picInPic.disabled = false
    })

    if ('pictureInPictureEnabled' in document) {
      this.showPipButton(picInPic)

      this.video.addEventListener('loadedmetadata', () => {
        this.showPipButton(picInPic)
      })

      this.video.addEventListener('emptied', () => {
        this.showPipButton(picInPic)
      })
    }

    this.player.querySelector('.j-fullscreen')
      .addEventListener(
        'click',
        this.toggleFullscreen.bind(this)
      )
  }

  initTimelineListeners()
  {
    const line = this.player.querySelector('.j-line')
    const current = line.querySelector('.j-line-current')
    const ghost = line.querySelector('.j-line-ghost')

    let dragMode

    const moveGhost = e => dragMode || this.calcLine(e, ghost)
    const dragCurrent = e => {
      this.video.currentTime = this.calcVideoTime(e, Player.getRect(e.target, 'left'))
      this.calcLine(e, current)
    }

    const mouseup = () => {
      line.removeEventListener('mousemove', dragCurrent)
      line.removeEventListener('mouseup', mouseup)

      dragMode = false
    }

    const mousedown = e => {
      this.video.currentTime = this.calcVideoTime(e, Player.getRect(e.target, 'left'))

      line.addEventListener('mousemove', dragCurrent)
      line.addEventListener('mouseup', mouseup)

      ghost.style.width = '0px'
      dragMode = true
    }

    line.addEventListener('mousedown', mousedown)
    line.addEventListener('mousemove', moveGhost)
  }

  initPageListeners()
  {
    document.addEventListener('click', e => {
      if (e.target.tagName !== 'SPAN' || e.target.className !== 'material-symbols-rounded') {
        this.player.querySelector('.j-speed-options').classList.remove('show')
      }
    })

    document.addEventListener('keydown', e => {
      if (e.code === 'Space') {
        e.preventDefault()
        ignore(this.toggleVideo())

      } else if (e.code === 'ArrowRight') {
        this.video.currentTime += 5

      } else if (e.code === 'ArrowLeft') {
        this.video.currentTime -= 5
      }
    })
  }

  showPipButton(picInPic)
  {
    picInPic.disabled = (this.video.readyState === 0) || !document.pictureInPictureEnabled || this.video.disablePictureInPicture
  }

  setVolume({ target })
  {
    this.video.volume = target.value / 100
  }

  async toggleVideo()
  {
    const icon = this.player.querySelector('.j-toggle-video .fas')

    this.video.src ||= URL.createObjectURL(await open('video/*'))

    this.isPlaying = !this.isPlaying

    this.player.querySelector('.j-play').style.display = this.isPlaying ? 'block' : 'none'
    this.player.querySelector('.j-pause').style.display = this.isPlaying ? 'none' : 'block'

    icon.classList.toggle('fa-play', !this.isPlaying)
    icon.classList.toggle('fa-pause', this.isPlaying)

    this.video[this.isPlaying ? 'play' : 'pause']()
  }

  setVideoDuration()
  {
    const duration = Number(this.video.duration.toFixed())
    const current = Number(this.video.currentTime.toFixed())
    const newTime = `${Player.formatTime(current)} / ${Player.formatTime(duration)}`
    const durationElement = this.player.querySelector('.j-duration')

    this.player.querySelector('.j-line-current').style.width = `${current / (duration / 100)}%`

    if (durationElement.innerHTML !== newTime) {
      durationElement.innerHTML = newTime;
    }
  }

  async toggleFullscreen()
  {
    try {

      document.fullscreenElement ? await document.exitFullscreen() : await this.player.requestFullscreen()

    } catch (e) {
    }
  }

  checkFullscreen()
  {
    const isFullscreen = Boolean(document.fullscreenElement)
    const icon = this.player.querySelector('.j-fullscreen .fas')

    icon.classList.toggle(FULLSCREEN_ICONS.expand, !isFullscreen)
    icon.classList.toggle(FULLSCREEN_ICONS.compress, isFullscreen)

    this.player.classList.toggle('player--fullscreen', isFullscreen)
  }

  calcVideoTime(e, left)
  {
    const needPercent = ((e.clientX - left) / e.target.offsetWidth)

    return this.video.duration * needPercent
  }

  updateVolumeInput()
  {
    const toggleClasses = this.player.querySelector('.j-toggle-volume').classList

    this.player.querySelector('.j-volume-input').value = this.video.volume * 100

    toggleClasses.remove(VOLUME_ICONS.up, VOLUME_ICONS.down, VOLUME_ICONS.off, VOLUME_ICONS.mute)

    if (this.video.volume > .66) {
      toggleClasses.add(VOLUME_ICONS.up)
    } else if (this.video.volume > .33) {
      toggleClasses.add(VOLUME_ICONS.down)
    } else if (this.video.volume > 0) {
      toggleClasses.add(VOLUME_ICONS.off)
    } else if (this.video.volume === 0) {
      toggleClasses.add(VOLUME_ICONS.mute)
    }
  }

  calcLine(e, line)
  {
    const left = Player.getRect(e.target, 'left')
    const hint = this.player.querySelector('.j-hint')

    hint.innerHTML = Player.formatTime(this.calcVideoTime(e, left))
    hint.style.left = `${e.clientX - (left + (hint.offsetWidth / 2))}px`
    line.style.width = `${e.clientX - left}px`
  }

  toggleInterface()
  {
    this.player.classList.toggle('player--hide-interface', this.isHiddenInterface)
  }

  checkInterface()
  {
    this.isHiddenInterface = false

    this.timeout && clearTimeout(this.timeout)

    this.timeout = setTimeout(() => {
      this.isHiddenInterface = true
    }, 5000)
  }
}
