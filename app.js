// --- INITIAL STATE ---
let selections = { class: '', subject: '', person: '' }; 
let currentUser = "";
let currentLessonIndex = null;
let questions = [];

const DB_URL = "https://questionpapermaker-226ad-default-rtdb.firebaseio.com/.json";

// --- CLOUD & SYNC LOGIC ---
async function syncFromCloud() {
    try {
        const response = await fetch(DB_URL);
        const data = await response.json();
        if (data) {
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, JSON.stringify(data[key]));
            });
            console.log("Cloud data synced!");
        }
    } catch (err) {
        console.error("Sync error:", err);
    }
}

function saveToCloud(key, data) {
    let personalKey = `${currentUser}_${key}`; 
    localStorage.setItem(personalKey, JSON.stringify(data)); 
    fetch(DB_URL, {
        method: 'PATCH',
        body: JSON.stringify({ [personalKey]: data }) 
    })
    .then(() => console.log("Saved to Firebase successfully!"))
    .catch(err => console.error("Firebase Save Error:", err));
}

window.onload = syncFromCloud;

// --- LOGIN ---
function login() {
    let u = document.getElementById("username").value.trim();
    let p = document.getElementById("password").value.trim();
    const allowedUsers = ["Komal", "Kunal", "Prajwal", "Pranay", "Payal"];
    if (allowedUsers.includes(u) && p === "1234") {
        currentUser = u;   
        selections.person = u;  
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.body.classList.remove("login-bg");
        syncFromCloud(); 
    } else {
        alert("Access Denied!");
    }
}

// --- SUBJECT MANAGEMENT ---
async function selectClass(val) {
    await syncFromCloud(); 
    selections.class = val;
    let key = `subjects_class_${val}`;
    let subjects = JSON.parse(localStorage.getItem(`${currentUser}_${key}`)) || [];  
    if (!subjects.includes("Mathematics")) {
        subjects.unshift("Mathematics");
        saveToCloud(key, subjects);
    }
    document.getElementById('currentStepTitle').innerText = "Class " + val;
    loadSubjects();
    showStep('subjectStep');
}

function loadSubjects() {
    let key = `${currentUser}_subjects_class_${selections.class}`; 
    let subjects = JSON.parse(localStorage.getItem(key)) || [];
    let html = `
        <div class="management-header" style="margin-bottom:20px;">
            <div class="add-box">
                <input type="text" id="newSubName" placeholder="Add New Subject...">
                <button onclick="addSubject()" class="add-btn">+ Add Subject</button>
            </div>
        </div>`;
    subjects.forEach((s, i) => {
        html += `
        <div class="lesson-item">
            <span><b>${i+1}.</b> ${s}</span>
            <div class="btn-group">
                <button class="open-btn" onclick="selectSubject('${s}')">Select</button>
                <button class="edit-btn" onclick="editSubject(${i})">Edit</button>
                ${s !== "Mathematics" ? `<button class="del-btn" onclick="deleteSubject(${i})">Delete</button>` : ''}
            </div>
        </div>`;
    });
    document.getElementById('subjectList').innerHTML = html || '<p>No subjects added.</p>';
}

function addSubject() {
    let name = document.getElementById('newSubName').value.trim();
    if(!name) return;
    let key = `subjects_class_${selections.class}`;
    let subjects = JSON.parse(localStorage.getItem(`${currentUser}_${key}`)) || []; 
    subjects.push(name);
    saveToCloud(key, subjects); 
    loadSubjects();
    document.getElementById('newSubName').value = '';
}

function editSubject(i) {
    let key = `subjects_class_${selections.class}`;
    let subjects = JSON.parse(localStorage.getItem(`${currentUser}_${key}`));
    let newName = prompt("Enter new subject name:", subjects[i]);
    if(newName) {
        subjects[i] = newName;
        saveToCloud(key, subjects);
        loadSubjects();
    }
}

function deleteSubject(i) {
    if(!confirm("Are you sure? All lessons in this subject will be lost.")) return;
    let key = `subjects_class_${selections.class}`;
    let subjects = JSON.parse(localStorage.getItem(`${currentUser}_${key}`));
    subjects.splice(i, 1);
    saveToCloud(key, subjects);
    loadSubjects();
}

// --- LESSON MANAGEMENT ---
function selectSubject(val) {
    selections.subject = val;
    document.getElementById('currentStepTitle').innerText = `${val} - ${currentUser}'s Panel`; 
    loadLessons();  
    showStep('lessonStep');  
}

function loadLessons() {
    let key = `${currentUser}_lessons_${selections.class}_${selections.subject}`; 
    let lessons = JSON.parse(localStorage.getItem(key)) || [];
    let html = '';
    lessons.forEach((lesson, index) => {
        html += `
        <div class="lesson-item">
            <input type="checkbox" class="lesson-checkbox" value="${index}" style="width:20px; height:20px; margin-right:10px;">
            <span style="flex-grow:1;"><b>${index + 1}.</b> ${lesson.name}</span>
            <div class="btn-group">
                <button class="open-btn" onclick="openLesson(${index})">Open Questions</button>
                <button class="edit-btn" onclick="editLesson(${index})">Edit</button>
                <button class="del-btn" onclick="deleteLesson(${index})">Delete</button>
            </div>
        </div>`;
    });
    let combineBtn = lessons.length > 0 ? `<button onclick="combineLessons()" class="gen-btn" style="background:#6c5ce7; margin-top:15px; width:100%;">Combine Selected Lessons</button>` : '';
    document.getElementById('lessonList').innerHTML = (html || '<p>No lessons found.</p>') + combineBtn;
}

function addLesson() {
    let name = document.getElementById('newLessonName').value.trim();
    if(!name) return;
    let key = `lessons_${selections.class}_${selections.subject}`; 
    let lessons = JSON.parse(localStorage.getItem(`${currentUser}_${key}`)) || [];
    lessons.push({ name: name, questions: [], savedPapers: [] });
    saveToCloud(key, lessons); 
    document.getElementById('newLessonName').value = '';
    loadLessons();
}

function editLesson(i) {
    let key = `lessons_${selections.class}_${selections.subject}`;
    let lessons = JSON.parse(localStorage.getItem(`${currentUser}_${key}`));
    let newName = prompt("Enter new lesson name:", lessons[i].name);
    if(newName) {
        lessons[i].name = newName;
        saveToCloud(key, lessons);
        loadLessons();
    }
}

function deleteLesson(i) {
    if(!confirm("Delete this lesson?")) return;
    let key = `lessons_${selections.class}_${selections.subject}`;
    let lessons = JSON.parse(localStorage.getItem(`${currentUser}_${key}`));
    lessons.splice(i, 1);
    saveToCloud(key, lessons);
    loadLessons();
}

// --- QUESTION BUILDER & PAPER GENERATION ---
function openLesson(index) {
    currentLessonIndex = index;
    let key = `${currentUser}_lessons_${selections.class}_${selections.subject}`; 
    let lessons = JSON.parse(localStorage.getItem(key));
    document.getElementById('currentLessonTitle').innerText = "Topic: " + lessons[index].name;
    questions = lessons[index].questions || [];
    display();
    showStep('builderStep');
}

function addQuestion() {
    let qText = document.getElementById("question").value.trim();
    if(!qText) return;
    questions.push({ q: qText, a: "", img: "" });
    document.getElementById("question").value = "";
    if(currentLessonIndex !== "MULTI") saveQuestionsToStorage();
    display();
}
// --- MATH UTILS ---
function insertMath(symbol) {
    // Ye line dhyan se dekhiye, ye aapke input boxes ki ID check karta hai
    let input = document.getElementById("question") || document.getElementById("bulkQuestions");
    
    if (input) {
        let start = input.selectionStart;
        let end = input.selectionEnd;
        let text = input.value;
        input.value = text.substring(0, start) + symbol + text.substring(end);
        input.focus();
        // Cursor ko symbol ke aage set karne ke liye
        input.setSelectionRange(start + symbol.length, start + symbol.length);
    } else {
        console.error("Input box not found!");
    }
}
// insertMath function ke niche ise paste karein:
function uploadDiagram(inputElement) {
    const file = inputElement.files[0];
    const targetInput = document.getElementById("question") || document.getElementById("bulkQuestions");
    
    if (file && targetInput) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            // Question box mein ek <img> tag insert karega
            const imgTag = `\n<img src="${base64Image}" style="max-width:200px; display:block; margin:10px 0;">\n`;
            
            let start = targetInput.selectionStart;
            let text = targetInput.value;
            targetInput.value = text.substring(0, start) + imgTag + text.substring(targetInput.selectionEnd);
            
            targetInput.focus();
            saveQuestionsToStorage(); // Agar auto-save function hai toh
        };
        reader.readAsDataURL(file);
    }
}
function saveQuestionsToStorage() {
    let key = `lessons_${selections.class}_${selections.subject}`; 
    let lessons = JSON.parse(localStorage.getItem(`${currentUser}_${key}`));
    lessons[currentLessonIndex].questions = questions;
    saveToCloud(key, lessons); 
}

function display() {
    let bank = document.getElementById("bank");
    let toolbar = selections.subject === "Mathematics" ? `
    <div class="math-toolbar" style="margin-bottom:10px; display:flex; gap:5px;">
        <button type="button" onclick="insertMath('²')">x²</button>
        <button type="button" onclick="insertMath('³')">x³</button>
        <button type="button" onclick="insertMath('√')">√</button>
        <button type="button" onclick="insertMath('π')">π</button>
        <button type="button" onclick="insertMath('θ')">θ</button>
        <label style="background:#eee; padding:2px 8px; border:1px solid #ccc; cursor:pointer; border-radius:3px; font-size:12px;">
            📁 Upload Diagram
            <input type="file" accept="image/*" style="display:none" onchange="uploadDiagram(this)">
        </label>
    </div>` : "";
    
    bank.innerHTML = `
        <div style="margin-bottom:15px; display:flex; gap:10px;">
            <button onclick="showSavedPapersList()" style="background:#2980b9; color:white; padding:8px 15px; border:none; border-radius:5px; cursor:pointer;">📁 View Saved Papers</button>
        </div>
        <div id="savedPapersSection" style="display:none; background:#f9f9f9; padding:15px; border:1px solid #ddd; border-radius:8px; margin-bottom:20px;">
            <h4 style="margin-top:0;">Saved History:</h4>
            <ul id="papersList" style="padding:0; list-style:none;"></ul>
            <button onclick="document.getElementById('savedPapersSection').style.display='none'" style="cursor:pointer; padding:5px 10px;">Close History</button>
        </div>
    ` + toolbar + questions.map((item, i) => {
        return `
        <div style="padding:15px; border-bottom:1px solid #eee; background:#fff; margin-bottom:10px; border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="display:flex; align-items:center;">
                <input type="checkbox" data-index="${i}" class="q-select" style="width:20px; height:20px; cursor:pointer;">
                <div style="flex-grow:1; margin-left:15px;">
                    <b style="font-size:16px;">${item.q}</b>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; background:#f0f0f0; padding:5px; border-radius:5px; margin-left:10px;">
                    <label style="font-size:10px; font-weight:bold; margin-bottom:2px;">LINES</label>
                    <input type="number" id="lines_${i}" value="0" min="0" max="20" style="width:45px; text-align:center;">
                </div>
                <button onclick="deleteQ(${i})" style="color:#e74c3c; border:none; background:none; cursor:pointer; margin-left:15px; font-size:18px;">&times;</button>
            </div>
            <div style="margin-top:12px;">
                <input type="text" placeholder="Write answer here..." value="${item.a || ''}" onchange="updateAns(${i}, this.value)" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
            </div>
        </div>`;
    }).join('');
}

function generateOutput(type) {
    let selected = document.querySelectorAll(".q-select:checked");
    if(selected.length === 0) { alert("Select questions first!"); return; }
    let examName = document.getElementById('paperTitle').value || 'Test Paper';
    let pTime = document.getElementById('paperTime').value || '';
    let pMarks = document.getElementById('paperMarks').value || '';
    let pDate = document.getElementById('paperDate').value || '';
    let isWorksheet = (type === 'ws');

    let output = `<div id="printArea" style="padding:20px; border:2px solid #000; font-family:Arial; width:100%; margin:auto; background:white;">
        <h1 style="text-align:center; margin-bottom:5px;">Narayana Tuition Classes</h1>
        <h3 style="text-align:center; margin-top:0;">${isWorksheet ? 'Worksheet' : examName}</h3>`;

    if (!isWorksheet) { output += `<div style="text-align:center; font-weight:bold; margin-bottom:15px;">Date: ${pDate}</div>`; }

    output += `<div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:10px; font-size:15px;">
            <div>${!isWorksheet ? `Time: ${pTime}` : ''}<br>Class: ${selections.class}</div>
            <div style="text-align:right;">${!isWorksheet ? `Marks: ${pMarks}` : ''}<br>Subject: ${selections.subject}</div>
        </div>
        <hr style="border:1.5px solid #000; margin:10px 0;">`;
    
    selected.forEach((cb, i) => {
        let idx = cb.getAttribute('data-index');
        let item = questions[idx];
        let reqLines = parseInt(document.getElementById('lines_' + idx).value) || 0;
        output += `<div style="margin-bottom:15px;">
            <p><b>Q.${i+1} ${item.q}</b></p>`;
        if (type === 'tp' && reqLines > 0) {
            for(let l=0; l<reqLines; l++) { output += `<div style="border-bottom: 1px solid #ccc; height: 25px; margin-bottom:5px;"></div>`; }
        }
        if(type === 'ws' && item.a) { output += `<p style="color: blue;"><i>Ans: ${item.a}</i></p>`; }
        output += `</div>`;
    });
    output += `</div>`;
    
    document.getElementById("paper").innerHTML = output + `
        <div style="margin-top:20px; display:flex; gap:10px; width:100%; margin:20px auto;">
            <button onclick="saveToFirebase()" style="background:#27ae60; color:white; padding:10px; flex:1; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">💾 Save Paper</button>
            // JS code ke aakhir mein jo button banta hai use aisa rakhein:
<button onclick="window.print()" style="background:#f39c12; color:white; padding:10px; flex:1; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">🖨️ Print Paper</button>
        </div>`;
}

// --- NEW/UPDATED FUNCTIONS FOR SAVING AND VIEWING ---

function saveToFirebase() {
    const element = document.getElementById('printArea');
    if(!element) { alert("Please generate the paper first!"); return; }
    if (currentLessonIndex === "MULTI") { alert("Only single lesson papers can be saved."); return; }

    let key = `lessons_${selections.class}_${selections.subject}`;
    let lessons = JSON.parse(localStorage.getItem(`${currentUser}_${key}`));
    
    if (!lessons[currentLessonIndex].savedPapers) lessons[currentLessonIndex].savedPapers = [];

    lessons[currentLessonIndex].savedPapers.push({
        type: document.querySelector('#printArea h3').innerText,
        date: new Date().toLocaleString(),
        content: element.innerHTML 
    });

    saveToCloud(key, lessons);
    alert("Paper saved to History successfully!");
}

function showSavedPapersList() {
    if (currentLessonIndex === "MULTI") { alert("History is not available for combined lessons."); return; }
    
    let key = `${currentUser}_lessons_${selections.class}_${selections.subject}`; 
    let lessons = JSON.parse(localStorage.getItem(key));
    let papers = (lessons && lessons[currentLessonIndex]) ? (lessons[currentLessonIndex].savedPapers || []) : [];
    
    let listArea = document.getElementById('papersList');
    document.getElementById('savedPapersSection').style.display = "block";
    listArea.innerHTML = "";

    if(papers.length === 0) {
        listArea.innerHTML = "<li style='padding:10px; color:#666;'>No papers saved yet.</li>";
        return;
    }

    papers.forEach((p, i) => {
        listArea.innerHTML += `
            <li style="padding:12px; border-bottom:1px solid #ddd; display:flex; justify-content:space-between; align-items:center; background:#fff; margin-bottom:5px; border-radius:4px;">
                <span style="font-size:14px;"><b>${p.type}</b> <br> <small style="color:#888;">${p.date}</small></span>
                <div style="display:flex; gap:5px;">
                    <button onclick="viewSavedPaper(${i})" style="padding:6px 12px; cursor:pointer; background:#2ecc71; color:white; border:none; border-radius:4px;">View</button>
                    <button onclick="deleteSavedPaper(${i})" style="padding:6px 12px; cursor:pointer; background:#e74c3c; color:white; border:none; border-radius:4px;">Delete</button>
                </div>
            </li>`;
    });
}

function viewSavedPaper(index) {
    let key = `${currentUser}_lessons_${selections.class}_${selections.subject}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    let paper = lessons[currentLessonIndex].savedPapers[index];
    
    let paperDiv = document.getElementById("paper");
    paperDiv.innerHTML = `
        <div id="printArea" style="padding:40px; border:2px solid #000; font-family:Arial; width:750px; margin:auto; background:white;">
            ${paper.content}
        </div>
        <div style="margin-top:20px; display:flex; gap:10px; width:750px; margin:auto;">
            <button onclick="window.print()" style="background:#f39c12; color:white; padding:10px; flex:1; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">🖨️ Print This Paper</button>
            <button onclick="document.getElementById('paper').innerHTML=''" style="background:#7f8c8d; color:white; padding:10px; flex:1; border:none; border-radius:5px; cursor:pointer;">Close</button>
        </div>`;
    
    window.scrollTo({ top: paperDiv.offsetTop - 20, behavior: 'smooth' });
}

function deleteSavedPaper(index) {
    if(!confirm("Delete this saved paper?")) return;
    let key = `lessons_${selections.class}_${selections.subject}`;
    let lessons = JSON.parse(localStorage.getItem(`${currentUser}_${key}`));
    lessons[currentLessonIndex].savedPapers.splice(index, 1);
    saveToCloud(key, lessons);
    showSavedPapersList();
}

// --- NAVIGATION & UTILS ---
function showStep(stepId) { 
    document.querySelectorAll('.step-container').forEach(s => s.style.display = 'none'); 
    document.getElementById(stepId).style.display = 'block'; 
}

function goBack() {
    let currentStep = "";
    document.querySelectorAll('.step-container').forEach(s => {
        if(s.style.display === 'block') currentStep = s.id;
    });
    if (currentStep === 'subjectStep') showStep('classStep');
    else if (currentStep === 'lessonStep') showStep('subjectStep');
    else if (currentStep === 'builderStep') { showStep('lessonStep'); loadLessons(); }
}

function logout() {
    if(!confirm("Are you sure you want to logout?")) return;
    location.reload(); 
}

function generatePaper() { generateOutput('tp'); }
function generateWorksheet() { generateOutput('ws'); }
function deleteQ(i) { questions.splice(i, 1); if(currentLessonIndex !== "MULTI") saveQuestionsToStorage(); display(); }
function updateAns(idx, val) { questions[idx].a = val; if(currentLessonIndex !== "MULTI") saveQuestionsToStorage(); }
