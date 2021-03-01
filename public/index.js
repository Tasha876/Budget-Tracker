let transactions = [];
let myChart;

// when online add applicable items in indexeddb to the main db and delete what needs to be deleted
const consolidate = () => {
  let toDelete = []
  let toKeep = []
  useOffline("get").then(tx => {
    console.log("here")
    tx.forEach(transaction => {
      if (transaction.delete) {
        toDelete.push(transaction.date)
      } else if (!transaction.delete){
        toKeep.push(transaction)
      }
      console.log("look here",tx)
    })

    console.log("to keep", toKeep)

    transaction = transactions.filter(transaction => {
      return !toDelete.includes(transaction.date)
    })

    toKeep.reverse()

    toKeep.forEach(transaction => {
      post({
        name: transaction.name,
        value: transaction.value,
        date: transaction.date,
      })
    })

    toDelete.forEach(transactionDate => {
      del(transactionDate)
    })

    transactions = toKeep.concat(transactions)

    useOffline("clear")
  })
  // populateChart();
  // populateTable();
  // populateTotal();
}

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;

    console.log(navigator.onLine)
    consolidate()

    console.log(transactions)
    populateTotal();
    populateTable();
    populateChart();

  });

// this function sends the data to the server
const post = (transaction) => {
  return fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => {    
    return console.log(response.json());
  })
  // .then(data => resolve(data))
}

// this function deletes from the server
const del = (id) => {
  return fetch("/api/transaction/" + id, {
    method: "DELETE",
  })
  .then(response => {    
    return response.json();
  })
}

//   console.log('here')
//   useOffline("get").then(tx => {
//     transactions.concat(console.log(tx.filter(transaction => !transaction.delete)));
//   })
//   useOffline("clear");
// }

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
    console.log(trash)
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
  let toDelete = transactions.find((transaction,i) => {
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
      useOffline("put", {
        _id: toDelete.date,
        name: toDelete.name,
        value: Number(toDelete.value),
        date: toDelete.date,
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
    if (data.errors) {
      errorEl.textContent = "Missing Information";
    }
    else {
      // clear form
      nameEl.value = "";
      amountEl.value = "";
    }
  })
  .catch(err => {
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
  useOffline("put",{
    _id: transaction.date,
    name: transaction.name,
    value: Number(transaction.value),
    date: transaction.date,
  });
};

// useOffline("get").then(tx => {
//   tx.forEach(transaction => {
//     transactions.push(transaction)
//     console.log(transaction)
//   });
  // populateTotal();
  // populateTable();
  // populateChart();
// });