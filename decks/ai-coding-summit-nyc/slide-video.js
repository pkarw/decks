// External script: the DC template parser rewrites camelCase inside inline scripts.
(() => {
  const selector = 'video[data-slide-autoplay]';
  const playVideo = (video) => {
    const startAt = Number(video.dataset.startAt || 0);
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    if (video.currentTime < startAt) video.currentTime = startAt;
    const play = () => video.play().catch(() => {});
    if (video.readyState >= 2) play();
    else video.addEventListener('canplay', play, { once: true });
  };

  document.addEventListener('slidechange', (event) => {
    document.querySelectorAll(selector).forEach((video) => {
      if (event.detail?.slide?.contains(video)) playVideo(video);
      else video.pause();
    });
  });

  window.addEventListener('load', () => {
    document.querySelectorAll('[data-deck-active] video[data-slide-autoplay]').forEach(playVideo);
  });
})();
