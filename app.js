let selections = { class: '', subject: '', person: '' };
let currentLessonIndex = null;
let questions = [];

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
    } else {
        alert("Access Denied!");
    }
}

// STEP 1: Select Class
function selectClass(val) {
    selections.class = val;
    let key = `subjects_class_${val}`;
    let subjects = JSON.parse(localStorage.getItem(key)) || [];
    
    if (!subjects.includes("Mathematics")) {
        subjects.unshift("Mathematics");
        localStorage.setItem(key, JSON.stringify(subjects));
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
    localStorage.setItem(key, JSON.stringify(subjects));
    loadSubjects();
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

function insertMath(sym) {
    let qInput = document.getElementById("question");
    qInput.value += sym;
    qInput.focus();
}

function addQuestion() {
    let qText = document.getElementById("question").value.trim();
    if(!qText) return;
    questions.push({ q: qText, a: "", img: "" });
    if(currentLessonIndex !== "MULTI") saveToStorage();
    document.getElementById("question").value = "";
    display();
}

function updateAns(idx, val) {
    questions[idx].a = val;
    if(currentLessonIndex !== "MULTI") saveToStorage();
}

// NAYA FUNCTION: Local file ko read karke save karne ke liye
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
            if(currentLessonIndex !== "MULTI") saveToStorage();
            display();
        };
        reader.readAsDataURL(file);
    }
}

function saveToStorage() {
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    lessons[currentLessonIndex].questions = questions;
    localStorage.setItem(key, JSON.stringify(lessons));
}

function display() {
    let bank = document.getElementById("bank");
    let toolbar = "";
    
    if (selections.subject === "Mathematics") {
        toolbar = `
            <div class="math-toolbar" style="margin-bottom:15px; padding:10px; background:#f8f9fa; border:1px solid #ddd; border-radius:8px; display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" onclick="insertMath('²')" style="padding:5px 10px; cursor:pointer;">x²</button>
                <button type="button" onclick="insertMath('³')" style="padding:5px 10px; cursor:pointer;">x³</button>
                <button type="button" onclick="insertMath('√')" style="padding:5px 10px; cursor:pointer;">√</button>
                <button type="button" onclick="insertMath('π')" style="padding:5px 10px; cursor:pointer;">π</button>
                <button type="button" onclick="insertMath('θ')" style="padding:5px 10px; cursor:pointer;">θ</button>
                <button type="button" onclick="insertMath(' ± ')" style="padding:5px 10px; cursor:pointer;">±</button>
                <button type="button" onclick="insertMath(' ÷ ')" style="padding:5px 10px; cursor:pointer;">÷</button>
            </div>
        `;
    }

    bank.innerHTML = toolbar + questions.map((item, i) => {
        let uploadOption = "";
        if (selections.subject === "Mathematics") {
            uploadOption = `
                <div style="flex:1;">
                    <label style="font-size:12px; color:grey; display:block;">Upload Diagram:</label>
                    <input type="file" accept="image/*" onchange="handleFileUpload(${i}, this)" style="font-size:11px; width:100%;">
                </div>
            `;
        }

        return `
        <div style="padding:15px; border-bottom:1px solid #eee; background:#fff; border-radius:8px; margin-bottom:10px;">
            <div style="display:flex; align-items:flex-start;">
                <input type="checkbox" data-index="${i}" class="q-select" style="width:20px; margin-right:10px; margin-top:5px;">
                <div style="flex-grow:1;">
                    <span style="font-weight:bold; display:block; margin-bottom:5px;">${item.q}</span>
                    ${item.img ? `<img src="${item.img}" style="max-width:150px; border-radius:4px; margin-bottom:5px; border:1px solid #ddd; display:block;">` : ''}
                </div>
                <button onclick="deleteQ(${i})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">X</button>
            </div>
            <div style="display:flex; gap:10px; margin-top:10px; align-items:flex-end;">
                <div style="flex:1;">
                    <label style="font-size:12px; color:grey; display:block;">Answer:</label>
                    <input type="text" placeholder="Answer..." value="${item.a || ''}" 
                        onchange="updateAns(${i}, this.value)" 
                        style="width:100%; padding:5px; border:1px solid #ddd; border-radius:4px;">
                </div>
                ${uploadOption}
            </div>
        </div>`;
    }).join('');
}

function deleteQ(i) {
    questions.splice(i, 1);
    if(currentLessonIndex !== "MULTI") saveToStorage();
    display();
}

// --- GENERATE PAPER OR WORKSHEET ---
function generateOutput(type) {
    let selected = document.querySelectorAll(".q-select:checked");
    if(selected.length === 0) { alert("Select questions first!"); return; }

    let examName = document.getElementById('paperTitle').value || 'Continuous Assessment';
    let isWorksheet = (type === 'ws');
    
    let timeInput = "";
    let marksInput = "";
    if(!isWorksheet) {
        timeInput = prompt("Enter Time:", "1.5 Hours");
        marksInput = prompt("Enter Total Marks:", "20");
    }

    let output = `
    <div id="printArea" style="padding:40px; border:3px solid #000; font-family:'Times New Roman', serif; background:white; color:black; min-height:800px;">
        <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">
            <h1 style="margin:0; font-size:28px; text-transform:uppercase;">Narayana Tution Classes</h1>
            <h3 style="margin:5px 0;">${examName} ${isWorksheet ? '(Worksheet)' : ''}</h3>
            <div style="display:flex; justify-content:space-between; margin-top:20px; font-weight:bold;">
                <span>Class: ${selections.class}th</span>
                <span>Subject: ${selections.subject}</span>
            </div>
            ${!isWorksheet ? `<div style="display:flex; justify-content:space-between; margin-top:5px; font-weight:bold;">
                <span>Time: ${timeInput}</span>
                <span>Max Marks: ${marksInput}</span>
            </div>` : ''}
        </div>
        <div style="margin-top:20px; font-size:18px; line-height:2;">
    `;
    
    selected.forEach((cb, i) => {
        let idx = cb.getAttribute('data-index');
        let item = questions[idx];
        output += `<div style="margin-bottom:25px;">
            <b>${item.q}</b>
            ${item.img ? `<br><img src="${item.img}" style="max-width:350px; margin-top:10px; border:1px solid #eee;">` : ''}
            ${isWorksheet && item.a ? `<div style="margin-left:25px; color:#333;"><i>Ans: ${item.a}</i></div>` : ''}
        </div>`;
    });
    
    output += `</div>
        ${!isWorksheet ? `<div style="margin-top:60px; display:flex; justify-content:space-between; font-weight:bold;">
            <span>Parent's Signature</span>
            <span>Teacher's Signature</span>
        </div>` : ''}
    </div>`;
    
    document.getElementById("paper").innerHTML = output;
    document.getElementById("paper").scrollIntoView({ behavior: 'smooth' });
}

function generatePaper() { generateOutput('tp'); }
function generateWorksheet() { generateOutput('ws'); }

function printPaper() {
    let content = document.getElementById("paper").innerHTML;
    let win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Print</title></head><body>' + content + '</body></html>');
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

function editSubject(index) {
    let key = `subjects_class_${selections.class}`;
    let subjects = JSON.parse(localStorage.getItem(key));
    let n = prompt("Edit Subject Name:", subjects[index]);
    if(n) { subjects[index] = n; localStorage.setItem(key, JSON.stringify(subjects)); loadSubjects(); }
}

function deleteSubject(index) {
    if(confirm("Are you sure?")) {
        let key = `subjects_class_${selections.class}`;
        let subjects = JSON.parse(localStorage.getItem(key));
        subjects.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(subjects));
        loadSubjects();
    }
}

function editLesson(index) {
    let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
    let lessons = JSON.parse(localStorage.getItem(key));
    let n = prompt("Update Lesson Name:", lessons[index].name);
    if(n) { lessons[index].name = n; localStorage.setItem(key, JSON.stringify(lessons)); loadLessons(); }
}

function deleteLesson(index) {
    if(confirm("Are you sure?")) {
        let key = `lessons_${selections.class}_${selections.subject}_${selections.person}`;
        let lessons = JSON.parse(localStorage.getItem(key));
        lessons.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(lessons));
        loadLessons();
    }
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
