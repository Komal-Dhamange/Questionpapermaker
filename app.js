let selections = { class: '', subject: '', person: '' };
let currentLessonIndex = null;
let questions = [];

// --- FIREBASE CONFIG ---
const DB_URL = "https://questionpapermaker-226ad-default-rtdb.firebaseio.com/.json";

// --- CLOUD SYNC FUNCTIONS ---

// 1. Data Load Function (Jab app start ho ya step change ho)
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

// 2. Data Save Function (Jab kuch bhi add/edit/delete ho)
function saveToCloud(key, data) {
    localStorage.setItem(key, JSON.stringify(data)); // Local backup
    fetch(DB_URL, {
        method: 'PATCH',
        body: JSON.stringify({ [key]: data })
    })
    .then(() => console.log("Saved to Firebase successfully!"))
    .catch(err => console.error("Firebase Save Error:", err));
}

// App load hote hi cloud se data le aao
window.onload = syncFromCloud;

// --- LOGIN ---
function login() {
    let u = document.getElementById("username").value.trim();
    let p = document.getElementById("password").value;
    const allowedUsers = ["Komal", "Kunal", "Prajwal", "Pranay", "Payal"];
    const securePassword = "1234";

    if (allowedUsers.includes(u) && p === securePassword) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.body.classList.remove("login-bg");
        syncFromCloud(); // Login ke baad sync
    } else {
        alert("Access Denied!");
    }
}

// STEP 1: Select Class
async function selectClass(val) {
    await syncFromCloud(); // Step change par sync taaki latest data mile
    selections.class = val;
    let key = `subjects_class_${val}`;
    let subjects = JSON.parse(localStorage.getItem(key)) || [];
    
    if (!subjects.includes("Mathematics")) {
        subjects.unshift("Mathematics");
        saveToCloud(key, subjects);
    }

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
    let subjects = JSON.parse(localStorage.getItem(key)) || [];
    subjects.push(name);
    saveToCloud(key, subjects); // Save to Firebase
    loadSubjects();
}

function selectSubject(val) {
    selections.subject = val;
    document.getElementById('currentStepTitle').innerText = val + " - Select Person";
    showStep('personStep');
}

// STEP 3: Select Person
async function selectPerson(val) {
    await syncFromCloud();
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
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key)) || [];
    lessons.push({ name: name, questions: [] });
    saveToCloud(key, lessons); // Save to Firebase
    document.getElementById('newLessonName').value = '';
    loadLessons();
}

function combineLessons() {
    let checked = document.querySelectorAll('.lesson-checkbox:checked');
    if(checked.length === 0) { alert("Please select lessons first!"); return; }
    
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    let allQ = [];
    checked.forEach(cb => {
        allQ = allQ.concat(lessons[cb.value].questions || []);
    });
    
    questions = allQ;
    currentLessonIndex = "MULTI";
    document.getElementById('currentLessonTitle').innerText = "Combined Lessons";
    display();
    showStep('builderStep');
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
    questions.push({ q: qText, a: "", img: "" });
    if(currentLessonIndex !== "MULTI") saveQuestionsToStorage();
    document.getElementById("question").value = "";
    display();
}

function saveQuestionsToStorage() {
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    lessons[currentLessonIndex].questions = questions;
    saveToCloud(key, lessons); // Save questions to Firebase
}

function updateAns(idx, val) {
    questions[idx].a = val;
    if(currentLessonIndex !== "MULTI") saveQuestionsToStorage();
}

function deleteQ(i) {
    questions.splice(i, 1);
    if(currentLessonIndex !== "MULTI") saveQuestionsToStorage();
    display();
}

// NAYA FUNCTION: Local file upload + Firebase sync
function handleFileUpload(idx, input) {
    const file = input.files[0];
    if (file) {
        if (file.size > 1024 * 1024) {
            alert("File size 1MB se choti honi chahiye!");
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            questions[idx].img = e.target.result;
            if(currentLessonIndex !== "MULTI") saveQuestionsToStorage();
            display();
        };
        reader.readAsDataURL(file);
    }
}

// Baaki Display aur Paper Generation functions (No Change Needed)
function display() {
    let bank = document.getElementById("bank");
    let toolbar = "";
    
    if (selections.subject === "Mathematics") {
        toolbar = `
            <div class="math-toolbar" style="margin-bottom:15px; padding:10px; background:#f8f9fa; border:1px solid #ddd; border-radius:8px; display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" onclick="insertMath('²')">x²</button>
                <button type="button" onclick="insertMath('³')">x³</button>
                <button type="button" onclick="insertMath('√')">√</button>
                <button type="button" onclick="insertMath('π')">π</button>
                <button type="button" onclick="insertMath('θ')">θ</button>
                <button type="button" onclick="insertMath(' ± ')">±</button>
                <button type="button" onclick="insertMath(' ÷ ')">÷</button>
            </div>
        `;
    }

    bank.innerHTML = toolbar + questions.map((item, i) => {
        let uploadOption = "";
        if (selections.subject === "Mathematics") {
            uploadOption = `<div style="flex:1;"><label>Upload Diagram:</label><input type="file" onchange="handleFileUpload(${i}, this)"></div>`;
        }

        return `<div style="padding:15px; border-bottom:1px solid #eee; background:#fff; margin-bottom:10px;">
            <div style="display:flex;">
                <input type="checkbox" data-index="${i}" class="q-select">
                <div style="flex-grow:1; margin-left:10px;">
                    <b>${item.q}</b>
                    ${item.img ? `<img src="${item.img}" style="max-width:150px; display:block;">` : ''}
                </div>
                <button onclick="deleteQ(${i})" style="color:red; border:none; background:none; cursor:pointer;">X</button>
            </div>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <input type="text" placeholder="Answer..." value="${item.a || ''}" onchange="updateAns(${i}, this.value)" style="flex:2;">
                ${uploadOption}
            </div>
        </div>`;
    }).join('');
}

function insertMath(sym) {
    let qInput = document.getElementById("question");
    qInput.value += sym;
    qInput.focus();
}

// Utility Functions
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

// Edit functions with Sync
function editSubject(index) {
    let key = `subjects_class_${selections.class}`;
    let subjects = JSON.parse(localStorage.getItem(key));
    let n = prompt("Edit Subject Name:", subjects[index]);
    if(n) { subjects[index] = n; saveToCloud(key, subjects); loadSubjects(); }
}

function deleteSubject(index) {
    if(confirm("Are you sure?")) {
        let key = `subjects_class_${selections.class}`;
        let subjects = JSON.parse(localStorage.getItem(key));
        subjects.splice(index, 1);
        saveToCloud(key, subjects);
        loadSubjects();
    }
}

function editLesson(index) {
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    let n = prompt("Update Lesson Name:", lessons[index].name);
    if(n) { lessons[index].name = n; saveToCloud(key, lessons); loadLessons(); }
}

function deleteLesson(index) {
    if(confirm("Are you sure?")) {
        let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
        let lessons = JSON.parse(localStorage.getItem(key));
        lessons.splice(index, 1);
        saveToCloud(key, lessons);
        loadLessons();
    }
}

// Paper Generation (Simplified for brevity, keep your original if preferred)
function generateOutput(type) {
let selected = document.querySelectorAll(".q-select:checked");
if(selected.length === 0) { alert("Select questions first!"); return; }
let examName = document.getElementById('paperTitle').value || 'Continuous Assessment';
let pTime = document.getElementById('paperTime').value || '';
let pMarks = document.getElementById('paperMarks').value || '';
let pDate = document.getElementById('paperDate').value || '';

// Line 342 se replace shuru karein
let isWorksheet = (type === 'ws');

let output = `<div id="printArea" style="padding:30px; border:2px solid #000; font-family:Arial; width:95%; margin:auto;">
    <h1 style="text-align:center; margin-bottom:5px;">Narayana Tution Classes</h1>

    <h3 style="text-align:center; margin-top:0;">${isWorksheet ? 'Worksheet' : examName}</h3>

    <div style="text-align:center; font-weight:bold; margin-bottom:15px; font-size:15px;">
        Date: ${pDate}
    </div>

    ${!isWorksheet ? `
    <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:5px; font-size:15px;">
        <span>Time: ${pTime}</span>
        <span>Marks: ${pMarks}</span>
    </div>` : ''}

    <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px; margin-bottom:5px;">
        <span>Class: ${selections.class}</span>
        <span>Subject: ${selections.subject}</span>
    </div>
    <hr style="border:1.5px solid #000; margin-top:5px;">`;
    selected.forEach((cb) => {
        let item = questions[cb.getAttribute('data-index')];
        output += `<p><b>${item.q}</b></p>${item.img ? `<img src="${item.img}" style="max-width:300px;">` : ''}`;
        if(type === 'ws' && item.a) output += `<p><i>Ans: ${item.a}</i></p>`;
    });
    output += `</div>`;
    document.getElementById("paper").innerHTML = output;
}

function generatePaper() { generateOutput('tp'); }
function generateWorksheet() { generateOutput('ws'); }
function printPaper() { window.print(); }
