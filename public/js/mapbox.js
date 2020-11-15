/* eslint-disable */
// console.log('hello from the client side!!!!');

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2xlZXB5ZGF3YW4iLCJhIjoiY2toYTdnN3dmMTFnMzJwbnE0Mm00ajJwbyJ9.bmrhKARgZ8gYsFMegiXf1g';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sleepydawan/ckha838ox0dj619tb99gt18y2',
    scroll: false,
    // center: [-118, 34],
    // zoom: 6,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add Marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extends map bound to include current locations
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
