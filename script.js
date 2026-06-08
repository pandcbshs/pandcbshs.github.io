document.addEventListener('DOMContentLoaded', () => {
    
    // --- Toggle Sections (Tabs) ---
    window.toggleSection = function(sectionId) {
        const sections = ['whats-on', 'sponsor-us', 'time-schedule', 'event-map'];
        
        // Hide all sections except the target
        sections.forEach(id => {
            if(id !== sectionId) {
                const sec = document.getElementById(id);
                if (sec) sec.classList.add('hidden-section');
            }
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden-section');
            
            // Allow display block to render before scrolling
            setTimeout(() => {
                const navHeight = document.querySelector('.quick-nav').offsetHeight;
                const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }, 50);
        }
    };

    // --- Accordion Logic ---
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            const content = item.querySelector('.accordion-content');
            
            item.classList.toggle('active');
            
            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });

    // --- Time Schedule Logic ---
    const sliderStart = document.getElementById('slider-start');
    const sliderEnd = document.getElementById('slider-end');
    const sliderTrack = document.getElementById('slider-track');
    const displayStart = document.getElementById('display-start-time');
    const displayEnd = document.getElementById('display-end-time');
    const resultsContainer = document.getElementById('time-results');
    
    // Gather all events from the master list
    const allEvents = [];
    document.querySelectorAll('#events-master-list .event-item').forEach(el => {
        const titleEl = el.querySelector('.details h4');
        const venueEl = el.querySelector('.details p');
        allEvents.push({
            start: el.getAttribute('data-start'),
            end: el.getAttribute('data-end'),
            category: el.getAttribute('data-category'),
            title: titleEl ? titleEl.textContent.trim() : '',
            venue: venueEl ? venueEl.textContent.trim() : '',
            html: el.innerHTML
        });
    });

    function formatTime(decimalTime) {
        let hours = Math.floor(decimalTime);
        let minutes = (decimalTime - hours) * 60;
        let period = hours >= 12 ? 'PM' : 'AM';
        
        let displayHours = hours > 12 ? hours - 12 : hours;
        if (displayHours === 0) displayHours = 12; // 12 PM or 12 AM
        
        let displayMinutes = minutes === 0 ? '00' : minutes.toString();
        
        return `${displayHours}:${displayMinutes} ${period}`;
    }

    function formatTimeForData(decimalTime) {
        let hours = Math.floor(decimalTime);
        let minutes = (decimalTime - hours) * 60;
        let hh = hours < 10 ? '0' + hours : hours;
        let mm = minutes === 0 ? '00' : minutes;
        return `${hh}:${mm}`;
    }

    function updateSlider(e) {
        if(!sliderStart) return;
        
        let valStart = parseFloat(sliderStart.value);
        let valEnd = parseFloat(sliderEnd.value);
        
        // Prevent crossing thumbs
        if (valStart > valEnd) {
            if (e && e.target === sliderStart) {
                sliderStart.value = valEnd;
                valStart = valEnd;
            } else if (e && e.target === sliderEnd) {
                sliderEnd.value = valStart;
                valEnd = valStart;
            }
        }
        
        // Update visual track
        const min = parseFloat(sliderStart.min);
        const max = parseFloat(sliderStart.max);
        const percentStart = ((valStart - min) / (max - min)) * 100;
        const percentEnd = ((valEnd - min) / (max - min)) * 100;
        
        sliderTrack.style.left = percentStart + '%';
        sliderTrack.style.width = (percentEnd - percentStart) + '%';
        
        // Update display text
        displayStart.textContent = formatTime(valStart);
        displayEnd.textContent = formatTime(valEnd);
        
        // Filter events
        filterEventsBySlider(valStart, valEnd);
    }

    function filterEventsBySlider(valStart, valEnd) {
        if(!resultsContainer) return;

        const startString = formatTimeForData(valStart);
        const endString = formatTimeForData(valEnd);

        const filtered = allEvents.filter(event => {
            return event.start < endString && event.end > startString;
        });

        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<p class="placeholder-text">No activities found in this time interval.</p>';
        } else {
            filtered.sort((a, b) => a.start.localeCompare(b.start));
            
            let htmlContent = '<ul class="timetable time-schedule-list">';
            filtered.forEach(event => {
                htmlContent += `
                    <li class="event-item">
                        <div style="margin-right: 1rem; color: var(--col-primary); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; width: 60px;">
                            ${event.category}
                        </div>
                        ${event.html}
                    </li>
                `;
            });
            htmlContent += '</ul>';
            resultsContainer.innerHTML = htmlContent;
        }
    }

    if (sliderStart && sliderEnd) {
        sliderStart.addEventListener('input', updateSlider);
        sliderEnd.addEventListener('input', updateSlider);
        
        // Initial run
        updateSlider();
    }

    // --- Interactive Map Pin Setup ---
    const mapSvg = document.getElementById('bshs-map');
    const mapDetailCard = document.getElementById('map-detail-card');
    const mapLocationTitle = document.getElementById('map-location-title');
    const mapLocationEvents = document.getElementById('map-location-events');
    const closeMapCard = document.getElementById('close-map-card');

    if (mapSvg) {
        const venueCoordinates = {
            'Museum': { x: 140, y: 130 },
            'Upper Quad': { x: 320, y: 235 },
            'Quad Stage': { x: 260, y: 180 },
            'Main Stage': { x: 360, y: 180 },
            'Marketplace': { x: 150, y: 360 },
            'Food Bazaar': { x: 110, y: 440 },
            'Apron Cafe': { x: 265, y: 440 },
            'Apron': { x: 280, y: 350 },
            'Cinema 1': { x: 120, y: 230 },
            'Cinema 2': { x: 160, y: 270 },
            'ISC Court 1': { x: 585, y: 385 },
            'ISC Court 2': { x: 685, y: 385 },
            'ISC Courts 1 & 2': { x: 635, y: 425 },
            'Oval': { x: 635, y: 220 }
        };

        // Group events by venue
        const eventsByVenue = {};
        allEvents.forEach(evt => {
            if (evt.venue) {
                if (!eventsByVenue[evt.venue]) {
                    eventsByVenue[evt.venue] = [];
                }
                eventsByVenue[evt.venue].push(evt);
            }
        });

        // Add pins dynamically
        Object.keys(eventsByVenue).forEach(venueName => {
            const coords = venueCoordinates[venueName];
            if (coords) {
                const pinGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                pinGroup.setAttribute('class', 'map-pin');
                pinGroup.setAttribute('transform', `translate(${coords.x}, ${coords.y})`);
                pinGroup.setAttribute('data-venue', venueName);

                const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                ring.setAttribute('cx', '0');
                ring.setAttribute('cy', '0');
                ring.setAttribute('r', '14');
                ring.setAttribute('fill', 'var(--col-secondary)');
                ring.setAttribute('opacity', '0.4');
                ring.setAttribute('class', 'pulsing-ring');

                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', '0');
                dot.setAttribute('cy', '0');
                dot.setAttribute('r', '7');
                dot.setAttribute('fill', 'var(--col-secondary)');
                dot.setAttribute('stroke', 'white');
                dot.setAttribute('stroke-width', '2');

                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = `${venueName} (${eventsByVenue[venueName].length} events)`;

                pinGroup.appendChild(ring);
                pinGroup.appendChild(dot);
                pinGroup.appendChild(title);

                pinGroup.addEventListener('click', () => {
                    showVenueEvents(venueName, eventsByVenue[venueName]);
                });

                mapSvg.appendChild(pinGroup);
            }
        });

        function showVenueEvents(venueName, events) {
            events.sort((a, b) => a.start.localeCompare(b.start));

            mapLocationTitle.textContent = venueName;
            
            let html = '<ul class="map-event-list">';
            events.forEach(evt => {
                const [hStart, mStart] = evt.start.split(':').map(Number);
                const [hEnd, mEnd] = evt.end.split(':').map(Number);
                const startDec = hStart + mStart / 60;
                const endDec = hEnd + mEnd / 60;
                
                const timeStr = evt.start === evt.end 
                    ? formatTime(startDec) 
                    : `${formatTime(startDec)} - ${formatTime(endDec)}`;

                html += `
                    <li class="map-event-item">
                        <div class="map-event-time">${timeStr}</div>
                        <div class="map-event-title">${evt.title}</div>
                        <span class="map-event-category">${evt.category}</span>
                    </li>
                `;
            });
            html += '</ul>';
            mapLocationEvents.innerHTML = html;
            
            // Highlight active pin
            document.querySelectorAll('.map-pin circle').forEach(c => {
                if (c.getAttribute('fill') === 'var(--col-accent)') {
                    c.setAttribute('fill', 'var(--col-secondary)');
                }
            });
            const clickedPin = document.querySelector(`.map-pin[data-venue="${venueName}"] circle:nth-child(2)`);
            if (clickedPin) {
                clickedPin.setAttribute('fill', 'var(--col-accent)');
            }
        }

        if (closeMapCard) {
            closeMapCard.addEventListener('click', () => {
                mapLocationTitle.textContent = 'Select a Location';
                mapLocationEvents.innerHTML = '<p class="placeholder-text">Click a pin on the map to display the events scheduled for that location.</p>';
                // Reset pin colors
                document.querySelectorAll('.map-pin circle').forEach(c => {
                    if (c.getAttribute('fill') === 'var(--col-accent)') {
                        c.setAttribute('fill', 'var(--col-secondary)');
                    }
                });
            });
        }
    }
});
