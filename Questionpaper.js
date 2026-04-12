let questions = JSON.parse(localStorage.getItem("questions")) || [];

// LOGIN
function login() {
  let user = document.getElementById("username").value;
  if (!user) return alert("Enter username");

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("app").style.display = "block";
}

// ADD QUESTION
function addQuestion() {
  let q = document.getElementById("question").value;
  let subject = document.getElementById("subject").value;

  if (q === "") return alert("Enter question");

  questions.push({ q, subject });
  localStorage.setItem("questions", JSON.stringify(questions));

  display();
}

// DISPLAY BANK WITH CHECKBOX
function display() {
  let bank = document.getElementById("bank");
  bank.innerHTML = "";

  questions.forEach((item, i) => {
    let div = document.createElement("div");
    div.className = "question";

    div.innerHTML = `
      <input type="checkbox" value="${i}">
      ${item.q} (${item.subject})
      <button onclick="deleteQ(${i})">❌</button>
    `;

    bank.appendChild(div);
  });
}

// DELETE
function deleteQ(i) {
  questions.splice(i, 1);
  localStorage.setItem("questions", JSON.stringify(questions));
  display();
}

// GENERATE PAPER (SELECTED QUESTIONS)
function generatePaper() {
  let selected = document.querySelectorAll("input[type='checkbox']:checked");

  let title = document.getElementById("paperTitle").value;
  let subject = document.getElementById("paperSubject").value;
  let time = document.getElementById("time").value;
  let marks = document.getElementById("marks").value;

  let output = `
    <h2 style="text-align:center">${title}</h2>
    <p><b>Subject:</b> ${subject}</p>
    <p><b>Time:</b> ${time} | <b>Marks:</b> ${marks}</p>
    <hr>
  `;

  selected.forEach((cb, i) => {
    let q = questions[cb.value];
    output += `<p>${i + 1}. ${q.q}</p>`;
  });

  document.getElementById("paper").innerHTML = output;
}

// PRINT
function printPaper() {
  let content = document.getElementById("paper").innerHTML;
  let win = window.open();
  win.document.write(content);
  win.print();
}

// LOAD
display();