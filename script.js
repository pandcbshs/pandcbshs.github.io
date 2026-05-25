document.addEventListener('DOMContentLoaded', () => {
    
    // --- Toggle Sections (Tabs) ---
    window.toggleSection = function(sectionId) {
        const sections = ['whats-on', 'sponsor-us', 'time-schedule'];
        
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
        allEvents.push({
            start: el.getAttribute('data-start'),
            end: el.getAttribute('data-end'),
            category: el.getAttribute('data-category'),
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
});
