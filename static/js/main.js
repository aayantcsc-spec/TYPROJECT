// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger?.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Auto-refresh live scores
function refreshLiveScores() {
    fetch('/api/live-scores')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateLiveScores(data.data);
            }
        })
        .catch(error => console.error('Error:', error));
}

function updateLiveScores(matches) {
    // Update DOM with new match data
    console.log('Updating live scores:', matches);
}

// Refresh every 30 seconds if on live scores page
if (window.location.pathname.includes('live-scores')) {
    setInterval(refreshLiveScores, 30000);
}

// Fantasy Team Filters
function filterPlayers() {
    const roleFilter = document.getElementById('roleFilter')?.value;
    const teamFilter = document.getElementById('teamFilter')?.value;
    const players = document.querySelectorAll('.pool-player-card');
    
    players.forEach(player => {
        const role = player.dataset.role;
        const team = player.dataset.team;
        
        const roleMatch = roleFilter === 'all' || role === roleFilter;
        const teamMatch = teamFilter === 'all' || team === teamFilter;
        
        player.style.display = roleMatch && teamMatch ? 'block' : 'none';
    });
}

// Stats Tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Set match reminder
function setReminder(matchId) {
    alert(`Reminder set for match ${matchId}!`);
    // In production, this would use browser notifications or service workers
}

// Edit team name
function editTeamName() {
    const newName = prompt('Enter new team name:');
    if (newName) {
        // Submit form to update team name
        const form = document.createElement('form');
        form.method = 'POST';
        form.innerHTML = `
            <input type="hidden" name="action" value="update_name">
            <input type="hidden" name="team_name" value="${newName}">
        `;
        document.body.appendChild(form);
        form.submit();
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add loading states for buttons
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function() {
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        }
    });
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe cards and sections
document.querySelectorAll('.match-card, .feature-card, .player-card, .news-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s, transform 0.5s';
    observer.observe(el);
});