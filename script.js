 const API_URL = "https://api.sheety.co/3c80c91a176d887673f5e8a9aded8290/jeePaper1/sheet1"; 
    let questions = []; 
    let currentIndex = 0;
    let responses = JSON.parse(localStorage.getItem('jee_responses')) || {}; 
    let status = JSON.parse(localStorage.getItem('jee_status')) || {}; 

    // 1. TIMER (Lockdown Mode)
    function initTimer() {
        let endTime = localStorage.getItem('exam_end_time');
        if (localStorage.getItem('exam_finished') === "true") {
            document.body.innerHTML = "<div style='text-align:center;padding:100px;'><h1>Test Already Submitted.</h1></div>";
            return;
        }
        if (!endTime) {
            endTime = Math.floor(Date.now() / 1000) + (180 * 60);
            localStorage.setItem('exam_end_time', endTime);
        }
        setInterval(() => {
            let diff = endTime - Math.floor(Date.now() / 1000);
            if (diff <= 0) submitTest(true);
            let h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
            document.getElementById('timer').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }, 1000);
    }

    // 2. LOAD DATA
    async function loadExam() {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            questions = data.sheet1.map(item => ({
                q: item.question,
                options: [item.option1, item.option2, item.option3, item.option4],
                ans: item.correct 
            }));
            if (!status[0]) status[0] = 'visited';
            renderQuestion();
            renderPalette();
        } catch (e) { document.getElementById('q-text').innerText = "API Error. Check Sheety permissions."; }
    }

    function renderQuestion() {
        const q = questions[currentIndex];
        document.getElementById('q-title').innerText = `Question No. ${currentIndex + 1}`;
        document.getElementById('q-text').innerHTML = q.q;
        let html = "";
        q.options.forEach((opt, i) => {
            let chk = responses[currentIndex] == i ? 'checked' : '';
            html += `<div style="margin:10px 0;padding:10px;border:1px solid #ddd; border-radius:5px;"><label style="cursor:pointer; display:block;"><input type="radio" name="opt" value="${i}" ${chk}> ${opt}</label></div>`;
        });
        document.getElementById('options-list').innerHTML = html;
    }

    function renderPalette() {
        let html = "";
        questions.forEach((_, i) => {
            let cls = "";
            if (responses[i] !== undefined) cls = "answered";
            else if (status[i] === 'marked') cls = "marked";
            else if (status[i] === 'visited') cls = "not-answered";
            html += `<div class="q-num ${cls}" onclick="jumpTo(${i})">${i+1}</div>`;
        });
        document.getElementById('palette-grid').innerHTML = html;
    }

    // 3. ACTIONS
    function saveAndNext() {
        const sel = document.querySelector('input[name="opt"]:checked');
        if (sel) {
            responses[currentIndex] = sel.value;
            status[currentIndex] = 'answered';
        } else {
            status[currentIndex] = 'visited';
        }
        moveNext();
    }

    function markForReview() {
        status[currentIndex] = 'marked';
        moveNext();
    }

    function moveNext() {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            if (!status[currentIndex]) status[currentIndex] = 'visited';
            localStorage.setItem('jee_responses', JSON.stringify(responses));
            localStorage.setItem('jee_status', JSON.stringify(status));
            renderQuestion();
            renderPalette();
        }
    }

    function jumpTo(i) {
        currentIndex = i;
        if (!status[currentIndex]) status[currentIndex] = 'visited';
        renderQuestion();
        renderPalette();
    }

    function submitTest(auto = false) {
        if (!auto && !confirm("Are you sure you want to submit the test?")) return;
        localStorage.setItem('exam_finished', "true");
        let score = 0;
        questions.forEach((q, i) => {
            if (responses[i] == (q.ans - 1)) score += 4;
            else if (responses[i] !== undefined) score -= 1;
        });
        alert(`Test Submitted!\nFinal Score: ${score}`);
        location.reload();
    }

    window.onload = () => { initTimer(); loadExam(); };