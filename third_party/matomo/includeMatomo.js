if (MATOMO_URL && MATOMO_ID) {
  window['_paq'] = [];
  const _paq = window['_paq'] || [];
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  
  // See DNT header and not counting visitor: https://github.com/matomo-org/matomo/issues/12001
  // Should also use main.js numbers to find number of actual visitors
  _paq.push(["setDoNotTrack", true]);
  
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);

  // obtained by
  // curl 'https://stats.humanbrainproject.eu/matomo.js' | openssl dgst -sha384 -binary | openssl base64 -A
  const resSha384 = "yGkhmoBpWPCg9IZSGIz64itCivgzaXu+CXflD1GthTMPW3YUjF4FoJ8YUBGDTOF7"

  (function() {
    const u=MATOMO_URL;
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', MATOMO_ID]);
    const d=document,
    g=d.createElement('script'),
    s=d.getElementsByTagName('script')[0];
    g.type='text/javascript';
    g.async=true;
    g.defer=true;
    g.src=u+'matomo.js';
    g.integrity=`sha384-${resSha384}`;
    g.crossOrigin='anonymous'; 
    s.parentNode.insertBefore(g,s);
  })();
}
