let transactions = [];
let myChart;

fetch("/api/transaction")
  .then(response => {
    return response.json()
    // return response.json();
  })
  .then(data => {
    // save db data on global variable
    // transactions = data;
    transactions = data;
    console.log(transactions)
    // console.log(toKeep, transactions)
    populateTotal();
    populateTable();
    populateChart();

  });

// this function sends the data to the server
const post = (transaction) => {
  // console.log(transaction)
  return fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => console.log(response.json()));

}

// this function deletes from the server
const del = (id) => {
  return fetch("/api/transaction/" + id, {
    method: "DELETE",
  })
  .then(response => console.log(response.json()));
}

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + Number(t.value); // shouldn't be parseInt because you don't have to have a round amount of dollars
  }, 0);

  let totalEl = document.querySelector("#total");
  totalStr = `\$${total.toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace("$-", "&ndash;$"); // makes total prettier :) from someone way smarter than me on StackOverflow :D
  totalEl.innerHTML = totalStr;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  console.log(transactions)

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    let trash = document.createElement('i');
    trash.classList.add("fas", "fa-trash-alt","delete")
    trash.addEventListener("click",deleteTransaction)

    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>\$${Number(transaction.value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} </td>
    `.replace("$-", "&ndash;$")
    tr.append(trash);
    tr.setAttribute("data-id", transaction.date)
    tbody.append(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
      data: {
        labels,
        datasets: [{
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff",
            data
        }]
    }
  });
}

// delete transaction
function deleteTransaction(e) {

  let deleteEl = e.target.parentElement;
  console.log(deleteEl)
  
  let index;

  let id = deleteEl.getAttribute("data-id");
  // filter according to id if online
  let toDel = transactions.find((transaction,i) => {
    index = i;
    return transaction.date === id;
  })

  console.log(index);

  transactions.splice(index,1)
    // re-run logic to populate ui without old record
    populateChart();
    populateTable();
    populateTotal();
    
    // also delete from server
    del(id)
    .catch(e => {
      useOffline("add", {
        _id: toDel.date,
        delete: true,
      })
    })
  }

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");
  
  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();
  
  // also send to server
  
  post(transaction)
  .then(data => {
    console.log(data)
    if (data && data.errors) {
      errorEl.textContent = "Missing Information";
    }
    else {
      // clear form
      nameEl.value = "";
      amountEl.value = "";
    }
  })
  .catch(e => {
    console.log(e)
    // fetch failed, so save in indexed db
    saveRecord(transaction);
    // clear form
    nameEl.value = "";
    amountEl.value = "";
  });
}

document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};

// store in indexedDB if not online
const saveRecord = (transaction) => {
  useOffline("add",{
    name: transaction.name,
    value: Number(transaction.value),
    date: transaction.date,
  });
};

