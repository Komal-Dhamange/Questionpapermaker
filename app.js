let selections = { class: '', subject: '', person: '' }; 
let currentUser = "";
let currentLessonIndex = null;
let questions = [];

const DB_URL = "https://questionpapermaker-226ad-default-rtdb.firebaseio.com/.json";

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
}

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

function combineLessons() {
    let checked = document.querySelectorAll('.lesson-checkbox:checked');
    if(checked.length === 0) { alert("Please select lessons first!"); return; }
    let key = `${currentUser}_lessons_${selections.class}_${selections.subject}`; 
    let lessons = JSON.parse(localStorage.getItem(key));
    let allQ = [];
    checked.forEach(cb => { allQ = allQ.concat(lessons[cb.value].questions || []); });
    questions = allQ;
    currentLessonIndex = "MULTI";
    document.getElementById('currentLessonTitle').innerText = "Combined Lessons";
    display();
    showStep('builderStep');
}

function openLesson(index) {
    currentLessonIndex = index;
    let key = `${currentUser}_lessons_${selections.class}_${selections.subject}`; 
    let lessons = JSON.parse(localStorage.getItem(key));
    document.getElementById('currentLessonTitle').innerText = "Topic: " + lessons[index].name;
    questions = lessons[index].questions || [];
    display();
    showStep('builderStep');
}

// --- UPDATED DISPLAY FUNCTION WITH ORIGINAL LINE COUNTER ---
function display() {
    let bank = document.getElementById("bank");
    let toolbar = selections.subject === "Mathematics" ? `<div class="math-toolbar" style="margin-bottom:10px;"><button type="button" onclick="insertMath('²')">x²</button><button type="button" onclick="insertMath('√')">√</button></div>` : "";
    
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
                    ${item.img ? `<img src="${item.img}" style="max-width:150px; display:block; margin-top:10px;">` : ''}
                </div>
                
                <div style="display:flex; flex-direction:column; align-items:center; background:#f0f0f0; padding:5px; border-radius:5px; margin-left:10px;">
                    <label style="font-size:10px; font-weight:bold; margin-bottom:2px;">LINES</label>
                    <input type="number" id="lines_${i}" value="0" min="0" max="20" 
                           style="width:45px; text-align:center; border:1px solid #ccc; border-radius:3px; padding:2px; font-weight:bold;">
                </div>

                <button onclick="deleteQ(${i})" style="color:#e74c3c; border:none; background:none; cursor:pointer; margin-left:15px; font-weight:bold; font-size:18px;">&times;</button>
            </div>
            <div style="margin-top:12px;">
                <input type="text" placeholder="Write answer here..." value="${item.a || ''}" 
                       onchange="updateAns(${i}, this.value)" 
                       style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box;">
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

    let output = `<div id="printArea" style="padding:40px; border:2px solid #000; font-family:Arial; width:750px; margin:auto; background:white;">
        <h1 style="text-align:center; margin-bottom:5px;">Narayana Tuition Classes</h1>
        <h3 style="text-align:center; margin-top:0;">${isWorksheet ? 'Worksheet' : examName}</h3>`;

    if (!isWorksheet) { output += `<div style="text-align:center; font-weight:bold; margin-bottom:15px;">Date: ${pDate}</div>`; }

    output += `<div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:10px; font-size:15px; padding:0 5px;">
            <div style="text-align:left;">
                ${!isWorksheet ? `<div>Time: ${pTime}</div>` : ''}
                <div>Class: ${selections.class}</div>
            </div>
            <div style="text-align:right;">
                ${!isWorksheet ? `<div>Marks: ${pMarks}</div>` : ''}
                <div>Subject: ${selections.subject}</div>
            </div>
        </div>
        <hr style="border:1.5px solid #000; margin:10px 0;">`;
    
    selected.forEach((cb, i) => {
        let idx = cb.getAttribute('data-index');
        let item = questions[idx];
        let reqLines = parseInt(document.getElementById('lines_' + idx).value) || 0;
        output += `<div style="margin-bottom:15px;">
            <p style="margin:5px 0;"><b>Q.${i+1} ${item.q}</b></p>
            ${item.img ? `<img src="${item.img}" style="max-width:300px;">` : ''}`;
        if (type === 'tp' && reqLines > 0) {
            for(let l=0; l<reqLines; l++) { output += `<div style="border-bottom: 1px solid #ccc; height: 25px; width: 100%; margin-bottom:5px;"></div>`; }
        }
        if(type === 'ws' && item.a) { output += `<p style="color: blue; margin-top:5px;"><i>Ans: ${item.a}</i></p>`; }
        output += `</div>`;
    });
    output += `</div>`;
    
    document.getElementById("paper").innerHTML = output;

    document.getElementById("paper").innerHTML += `
        <div style="margin-top:20px; display:flex; gap:10px;">
            <button onclick="saveToFirebase()" style="background:#27ae60; color:white; padding:10px; flex:1; border:none; border-radius:5px; cursor:pointer;">💾 Save Paper to Lesson</button>
            <button onclick="window.print()" style="background:#f39c12; color:white; padding:10px; flex:1; border:none; border-radius:5px; cursor:pointer;">🖨️ Print Paper</button>
        </div>`;
}

// --- UPDATED SAVE TO FIREBASE FUNCTION ---
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
// --- LOGOUT FUNCTION ---
function logout() {
    if(!confirm("Are you sure you want to logout?")) return;
    currentUser = "";
    selections = { class: '', subject: '', person: '' };
    document.getElementById("app").style.display = "none";
    document.getElementById("loginBox").style.display = "block";
    document.body.classList.add("login-bg");
    
    // Form clear karne ke liye
    if(document.getElementById("username")) document.getElementById("username").value = "";
    if(document.getElementById("password")) document.getElementById("password").value = "";
}
function goBack() {
    let currentStep = "";
    // Check karein abhi kaunsa step visible hai
    document.querySelectorAll('.step-container').forEach(s => {
        if(s.style.display === 'block') currentStep = s.id;
    });

    if (currentStep === 'subjectStep') {
        showStep('classStep'); // Class select karne wale page par jayein
    } else if (currentStep === 'lessonStep') {
        showStep('subjectStep'); // Subject select karne wale page par jayein
    } else if (currentStep === 'builderStep') {
        showStep('lessonStep'); // Lesson list par wapas jayein
        loadLessons(); // List refresh karein
    }
}
// --- HISTORY LIST WITH VIEW & DELETE BUTTONS ---
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

// --- FUNCTION TO DELETE SAVED PAPER ---
function deleteSavedPaper(index) {
    if(!confirm("Are you sure you want to delete this saved paper permanently?")) return;

    let key = `lessons_${selections.class}_${selections.subject}`;
    let lessons = JSON.parse(localStorage.getItem(`${currentUser}_${key}`));
    
    // History se paper remove kiya
    lessons[currentLessonIndex].savedPapers.splice(index, 1);
    
    // Firebase aur LocalStorage update
    saveToCloud(key, lessons);
    
    // List refresh
    showSavedPapersList();
}

function viewSavedPaper(index) {
    let key = `${currentUser}_lessons_${selections.class}_${selections.subject}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    let paper = lessons[currentLessonIndex].savedPapers[index];
    document.getElementById("paper").innerHTML = `
        <div id="printArea" style="padding:40px; border:2px solid #000; font-family:Arial; width:750px; margin:auto; background:white;">
            ${paper.content}
        </div>
        <button onclick="window.print()" style="background:#f39c12; color:white; padding:10px; width:100%; margin-top:10px; border:none; border-radius:5px; cursor:pointer;">🖨️ Print This Paper</button>`;
}

function generatePaper() { generateOutput('tp'); }
function generateWorksheet() { generateOutput('ws'); }
function printPaper() { window.print(); }

function insertMath(sym) { let qInput = document.getElementById("question"); qInput.value += sym; qInput.focus(); }
function showStep(stepId) { document.querySelectorAll('.step-container').forEach(s => s.style.display = 'none'); document.getElementById(stepId).style.display = 'block'; }

function editSubject(i) { /* existing logic */ }
function deleteSubject(i) { /* existing logic */ }
function editLesson(i) { /* existing logic */ }
function deleteLesson(i) { /* existing logic */ }

function updateAns(idx, val) {
    questions[idx].a = val;
    if(currentLessonIndex !== "MULTI") saveQuestionsToStorage();
}

function deleteQ(i) {
    questions.splice(i, 1);
    if(currentLessonIndex !== "MULTI") saveQuestionsToStorage();
    display();
}

function saveQuestionsToStorage() {
    let key = `lessons_${selections.class}_${selections.subject}`; 
    let lessons = JSON.parse(localStorage.getItem(`${currentUser}_${key}`));
    lessons[currentLessonIndex].questions = questions;
    saveToCloud(key, lessons); 
}
