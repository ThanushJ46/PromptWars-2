// maps.js

function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement || typeof google === 'undefined') return;

  const map = new google.maps.Map(mapElement, {
    zoom: 15,
    center: { lat: 20.5937, lng: 78.9629 }, // India center default
    disableDefaultUI: true,
    zoomControl: true,
    styles: [
      {
        "elementType": "geometry",
        "stylers": [{"color": "#fcf9f8"}]
      },
      {
        "elementType": "labels.icon",
        "stylers": [{"visibility": "off"}]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#5A5A6A"}]
      },
      {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [{"color": "#e3bfb4"}]
      },
      {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [{"color": "#dde1ff"}]
      }
    ]
  });
  
  // Geolocation
  const locateBtn = document.getElementById('locateBtn');
  if (locateBtn) {
      locateBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    map.setCenter(currentPos);
                    
                    // Simulated booth location slightly offset from current
                    const boothPos = { lat: pos.coords.latitude + 0.005, lng: pos.coords.longitude + 0.005 };
                    
                    new google.maps.Marker({
                        position: boothPos,
                        map,
                        animation: google.maps.Animation.DROP,
                        title: "Govt. Higher Primary School (Booth 142)"
                    });
                    
                    // Show booth details
                    document.getElementById('boothDetails').classList.remove('hidden-section');
                },
                () => {
                    alert("Error: The Geolocation service failed.");
                }
            );
        } else {
            alert("Error: Your browser doesn't support geolocation.");
        }
      });
  }
}

// Share functions
function shareWhatsApp(boothName, mapsUrl) {
  const text = `My polling booth is: ${boothName}\nGet directions: ${mapsUrl}\nFind your booth: electoralsearch.eci.gov.in`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

function shareSMS(boothName, mapsUrl) {
  window.open(`sms:?body=${encodeURIComponent(`My polling booth: ${boothName} | ${mapsUrl}`)}`);
}

// Fallback for demo if google maps fails to load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if(typeof google === 'undefined' && document.getElementById('map')) {
            document.getElementById('map').innerHTML = `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: #eee; border-radius: var(--radius-lg); flex-direction: column;">
                    <span class="material-symbols-outlined" style="font-size: 3rem; color: #999;">map</span>
                    <p style="margin-top: 1rem; color: #666;">Map requires API key configuration.</p>
                </div>
            `;
            
            // Still allow the UI demo to work
            const locateBtn = document.getElementById('locateBtn');
            if(locateBtn) {
                locateBtn.addEventListener('click', () => {
                    document.getElementById('boothDetails').classList.remove('hidden-section');
                });
            }
        }
    }, 1000);
});
