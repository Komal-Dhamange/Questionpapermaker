let selections = { class: '', subject: '', person: '' };
let currentLessonIndex = null;
let questions = [];

// --- UPDATED LOGIN FUNCTION ---
function login() {
    let u = document.getElementById("username").value.trim(); // Username input
    let p = document.getElementById("password").value;        // Password input

    // Authorized names list (Strictly starting with Capital letters)
    const allowedUsers = ["Komal", "Kunal", "Prajwal", "Pranay", "Payal"];
    const securePassword = "1234";

    // Strict Case-Sensitive Check
    if (allowedUsers.includes(u) && p === securePassword) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.body.classList.remove("login-bg");
    } else {
        alert("Access Denied! Check your Username (First letter must be Capital) and Password.");
    }
}

// STEP 1: Select Class
function selectClass(val) {
    selections.class = val;
    document.getElementById('currentStepTitle').innerText = "Class " + val + " - Manage Subjects";
    loadSubjects();
    showStep('subjectStep');
}

// STEP 2: Subject Management
function loadSubjects() {
    let key = `subjects_class_${selections.class}`;
    let subjects = JSON.parse(localStorage.getItem(key)) || [];
    
    let html = `
        <div class="management-header" style="margin-bottom:20px;">
            <div class="add-box">
                <input type="text" id="newSubName" placeholder="Add New Subject Name...">
                <button onclick="addSubject()" class="add-btn">+ Add Subject</button>
            </div>
        </div>
    `;

    if (subjects.length === 0) {
        html += '<p style="padding:15px; color:#666;">No subjects added for this class yet.</p>';
    }

    subjects.forEach((s, i) => {
        html += `
        <div class="lesson-item">
            <span><b>${i+1}.</b> ${s}</span>
            <div class="btn-group">
                <button class="open-btn" onclick="selectSubject('${s}')">Select</button>
                <button class="edit-btn" onclick="editSubject(${i})">Edit</button>
                <button class="del-btn" onclick="deleteSubject(${i})">Delete</button>
            </div>
        </div>`;
    });
    document.getElementById('subjectList').innerHTML = html;
}

function addSubject() {
    let name = document.getElementById('newSubName').value.trim();
    if(!name) return;
    let key = `subjects_class_${selections.class}`;
    let subjects = JSON.parse(localStorage.getItem(key)) || [];
    subjects.push(name);
    localStorage.setItem(key, JSON.stringify(subjects));
    loadSubjects();
}

function editSubject(index) {
    let key = `subjects_class_${selections.class}`;
    let subjects = JSON.parse(localStorage.getItem(key));
    let n = prompt("Edit Subject Name:", subjects[index]);
    if(n) { 
        subjects[index] = n; 
        localStorage.setItem(key, JSON.stringify(subjects)); 
        loadSubjects(); 
    }
}

function deleteSubject(index) {
    if(confirm("Are you sure? All data linked to this subject will remain but the subject will be removed from this list.")) {
        let key = `subjects_class_${selections.class}`;
        let subjects = JSON.parse(localStorage.getItem(key));
        subjects.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(subjects));
        loadSubjects();
    }
}

function selectSubject(val) {
    selections.subject = val;
    document.getElementById('currentStepTitle').innerText = val + " - Select Person";
    showStep('personStep');
}

// STEP 3: Select Person
function selectPerson(val) {
    selections.person = val;
    document.getElementById('currentStepTitle').innerText = val + "'s Panel (" + selections.subject + ")";
    loadLessons();
    showStep('lessonStep');
}

// STEP 4: Lesson Management
function loadLessons() {
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key)) || [];
    let html = '';
    lessons.forEach((lesson, index) => {
        html += `
        <div class="lesson-item">
            <span><b>${index + 1}.</b> ${lesson.name}</span>
            <div class="btn-group">
                <button class="open-btn" onclick="openLesson(${index})">Open Questions</button>
                <button class="edit-btn" onclick="editLesson(${index})">Edit</button>
                <button class="del-btn" onclick="deleteLesson(${index})">Delete</button>
            </div>
        </div>`;
    });
    document.getElementById('lessonList').innerHTML = html || '<p style="padding:15px;">No lessons found. Add a lesson to start.</p>';
}

function addLesson() {
    let name = document.getElementById('newLessonName').value.trim();
    if(!name) return;
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key)) || [];
    lessons.push({ name: name, questions: [] });
    localStorage.setItem(key, JSON.stringify(lessons));
    document.getElementById('newLessonName').value = '';
    loadLessons();
}

function editLesson(index) {
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    let n = prompt("Update Lesson Name:", lessons[index].name);
    if(n) { lessons[index].name = n; localStorage.setItem(key, JSON.stringify(lessons)); loadLessons(); }
}

function deleteLesson(index) {
    if(confirm("Are you sure? All questions in this lesson will be deleted.")) {
        let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
        let lessons = JSON.parse(localStorage.getItem(key));
        lessons.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(lessons));
        loadLessons();
    }
}

// STEP 5: Question Management
function openLesson(index) {
    currentLessonIndex = index;
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    document.getElementById('currentLessonTitle').innerText = "Topic: " + lessons[index].name;
    questions = lessons[index].questions || [];
    display();
    showStep('builderStep');
}

function addQuestion() {
    let qText = document.getElementById("question").value.trim();
    if(!qText) return;
    qText.split("\n").forEach(line => { if(line.trim()) questions.push({ q: line.trim() }); });
    saveToStorage();
    document.getElementById("question").value = "";
    display();
}

function saveToStorage() {
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    lessons[currentLessonIndex].questions = questions;
    localStorage.setItem(key, JSON.stringify(lessons));
}

function display() {
    let bank = document.getElementById("bank");
    bank.innerHTML = questions.map((item, i) => `
        <div style="padding:10px; border-bottom:1px solid #eee; display:flex; align-items:center; background:#fff;">
            <input type="checkbox" data-index="${i}" style="width:20px; margin-right:10px;">
            <span style="flex-grow:1;">${item.q}</span>
            <button onclick="deleteQ(${i})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">X</button>
        </div>
    `).join('');
}

function deleteQ(i) {
    questions.splice(i, 1);
    saveToStorage();
    display();
}

function generatePaper() {
    let selected = document.querySelectorAll("input[type='checkbox']:checked");
    if(selected.length === 0) { alert("Please select questions first!"); return; }

    let examName = document.getElementById('paperTitle').value || 'Continuous Assessment';
    let time = prompt("Enter Time:", "1.5 Hours");
    let marks = prompt("Enter Total Marks:", "20");

    let output = `
    <div id="printArea" style="padding:40px; border:3px solid #000; font-family:'Times New Roman', serif; background:white; color:black; min-height:800px;">
        <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">
            <h1 style="margin:0; font-size:28px; text-transform:uppercase;">Narayana Tution Classes</h1>
            <h3 style="margin:5px 0;">${examName}</h3>
            <div style="display:flex; justify-content:space-between; margin-top:20px; font-weight:bold;">
                <span>Class: ${selections.class}th</span>
                <span>Subject: ${selections.subject}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:5px; font-weight:bold;">
                <span>Time: ${time}</span>
                <span>Max Marks: ${marks}</span>
            </div>
        </div>
        <div style="margin-top:20px;">
            <div id="questionsContainer" style="font-size:18px; line-height:2;">
    `;
    
    let qNum = 1;
    selected.forEach((cb) => {
        let idx = cb.getAttribute('data-index');
        let qText = questions[idx].q;
        
        if (qText.toLowerCase().includes("answer the following") || qText.toLowerCase().startsWith("que:")) {
            output += `<p style="margin-top:15px; margin-bottom:5px; font-weight:bold;">${qText}</p>`;
        } else {
            output += `<div style="margin-bottom:10px; padding-left:20px;">${qNum++}. ${qText}</div>`;
        }
    });
    
    output += `
            </div>
        </div>
        <div style="margin-top:60px; display:flex; justify-content:space-between; font-weight:bold;">
            <span>Parent's Signature</span>
            <span>Teacher's Signature</span>
        </div>
    </div>`;
    
    document.getElementById("paper").innerHTML = output;
    document.getElementById("paper").scrollIntoView({ behavior: 'smooth' });
}

function printPaper() {
    let content = document.getElementById("paper").innerHTML;
    let win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Print Paper</title></head><body>');
    win.document.write(content);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
}

function showStep(stepId) {
    document.querySelectorAll('.step-container').forEach(s => s.style.display = 'none');
    document.getElementById(stepId).style.display = 'block';
}

function goBack() {
    let current = document.querySelector('.step-container[style*="display: block"]');
    if(!current) return;
    if(current.id === 'subjectStep') showStep('classStep');
    else if(current.id === 'personStep') showStep('subjectStep');
    else if(current.id === 'lessonStep') showStep('personStep');
    else if(current.id === 'builderStep') showStep('lessonStep');
}

function logout() { location.reload(); }
