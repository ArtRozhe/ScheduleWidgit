/**
 * Created by user on 01.02.16.
 */
var schedule = (function() {

    var currentLpu = "0001",
        currentIdInHtml = "schedule",
        currentWeek = 0;

    function scheduleGo(week, lpu, idInHtml) {
        currentWeek = week || currentWeek;
        currentLpu = lpu || currentLpu;
        currentIdInHtml = idInHtml || currentIdInHtml;

        if (dataChecking(currentWeek, currentLpu, currentIdInHtml)) {
            var url = "https://er.em70.ru/api/schedule/get?lpu=" + currentLpu + "&week=" + currentWeek;

            runRequest(currentIdInHtml, url, createSchedule);
        } else {
            console.log("Error! Wrong data!")
        }
    }

    function runRequest(idInHtml, url, successCallback) {
        var req = new XMLHttpRequest(),
            data;

        req.open("GET", url, true);

        req.onreadystatechange = function() {
            if (req.readyState != 4) return;
            if (req.status != 200) {
                console.log(req.status + ": " + req.statusText);
            } else {
                data = JSON.parse(req.responseText);
                successCallback && successCallback(data, idInHtml, createTable);
            }
        };
        req.send(null)
    }

    function createSchedule(data, idInHtml, createTableCallback) {
        var listOfSpecialities = data.schedule.lpu[0].speciality,
            doctors = data.schedule.lpu[0].doctors,

            doctorsWeeksArr = createDoctorsWeeksArr(doctors),
            dateOfMonday = getDateOfMonday(doctors);

        if (!dateOfMonday) {
            console.log("Schedule not found!");
            return 0;
        }

        createTableCallback(idInHtml, listOfSpecialities ,doctors, doctorsWeeksArr, dateOfMonday);
    }

    function createTable(idInHtml, listOfSpecialities, doctors, doctorsWeeksArr, dateOfMonday) {
        var table = document.createElement("table"),
            elementWithId = document.getElementById(idInHtml),
            currentDate,
            headOfTable = document.createElement("tr"),
            headerCell = document.createElement("th"),
            days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
            i;

        clearIfThereIsTable(elementWithId);

        table.classList.add("table");

        headerCell.innerHTML = "Врач";
        headOfTable.appendChild(headerCell);

        for (i = 0; i < 7; i++) {
            currentDate = new Date(dateOfMonday);
            currentDate.setDate(currentDate.getDate() + i);
            headerCell = document.createElement("th");
            headerCell.innerHTML = days[i] + "<br/>" + get2DigitNumber(currentDate.getDate()) + "." + get2DigitNumber(currentDate.getMonth() + 1) + "." + currentDate.getFullYear();
            headOfTable.appendChild(headerCell);
        }
        headOfTable.classList.add("odd");
        table.appendChild(headOfTable);

        for (i = 0; i < doctors.length; i++) {
            addRow(doctors[i], doctorsWeeksArr, i, dateOfMonday, listOfSpecialities, table);
        }
        elementWithId.appendChild(table);

    }

    function clearIfThereIsTable(elementWithId) {
        while (elementWithId.hasChildNodes()) {
            elementWithId.removeChild(elementWithId.firstElementChild);
        }
    }

    function addRow(doctor, doctorsWeeksArr, numberOfDoctor, dateOfMonday, listOfSpecialities, table) {
        var row = document.createElement("tr"),
            col = document.createElement("td"),
            tempCell,
            timeWrap,
            nameOfDoctor = doctor.last_name + " " + doctor.first_name + " " + doctor.middle_name,
            specOfDoctor = getSpeciality(doctor.speciality_code, listOfSpecialities),
            nameOfDoctorWrap = document.createElement("span"),
            specOfDoctorWrap = document.createElement("span"),
            i, j;

        nameOfDoctorWrap.innerHTML = nameOfDoctor + "<br/>";
        specOfDoctorWrap.innerHTML = specOfDoctor;
        nameOfDoctorWrap.classList.add("specFIO");
        specOfDoctorWrap.classList.add("specName");

        col.appendChild(nameOfDoctorWrap);
        col.appendChild(specOfDoctorWrap);

        row.appendChild(col);

        for (i = 0; i < doctorsWeeksArr[numberOfDoctor].length; i++) {
            tempCell = document.createElement("td");
            for (j = 0; j < doctorsWeeksArr[numberOfDoctor][i].length; j++) {
                timeWrap = document.createElement("span");
                timeFrom = new Date(doctorsWeeksArr[numberOfDoctor][i][j].time_from);
                timeTo = new Date(doctorsWeeksArr[numberOfDoctor][i][j].time_to);
                timeWrap.innerHTML = timeFrom.getHours() + ":" + get2DigitNumber(timeFrom.getMinutes()) + "-" + timeTo.getHours() + ":" + get2DigitNumber(timeTo.getMinutes()) + "<br/>";

                tempCell.appendChild(timeWrap);

            }

            if (doctorsWeeksArr[numberOfDoctor][i].length === 0) {
                tempCell.innerHTML = "<span>Приёма нет</span>";
            }
            row.appendChild(tempCell);
        }
        if (numberOfDoctor % 2 === 1) {
            row.classList.add("odd");
        } else {
            row.classList.add("even");
        }
        table.appendChild(row);
    }

    function get2DigitNumber(minutes) {
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        return minutes;
    }

    function getSpeciality(code, list) {
        var i;

        for (i = 0; i < list.length; i++) {
            if (list[i].id == code) {
                return list[i].name;
            }
        }
        return "";
    }

    function createDoctorsWeeksArr(doctors) {
        var doctorsWeeks = [],
            week = [],
            numberOfDay,
            timeTo,
            timeFrom,
            i, j, k;

        for (i = 0; i < doctors.length; i++) {
            week = [[], [], [], [], [], [], []];
            for (j = 0; j < doctors[i].tickets.length; j++) {
                if (doctors[i].tickets[j].time) {
                    for ( k = 0; k < doctors[i].tickets[j].time.length; k++) {

                        timeFrom = new Date(doctors[i].tickets[j].time[k].time_from);
                        timeTo = new Date(doctors[i].tickets[j].time[k].time_to);

                        numberOfDay = (timeFrom.getDay() !== 0) ? (timeFrom.getDay() - 1) : 6;

                        doctors[i].tickets[j].time[k].room = doctors[i].tickets[j].room;
                        week[numberOfDay].push(doctors[i].tickets[j].time[k]);
                    }
                }
            }
            doctorsWeeks.push(week);
        }
        console.log(doctorsWeeks);
        return doctorsWeeks;
    }

    function getDateOfMonday(doctors) {
        var numberOfDay = 0,
            dateOfMonday = -1,
            date,
            i = 0;

        while (dateOfMonday === -1) {
            if(doctors[i].tickets[0].time) {
                date = new Date(doctors[i].tickets[0].time[0].time_from);

                numberOfDay = (date.getDay() !== 0) ? date.getDay() - 1 : 6;

                dateOfMonday = date.setDate(date.getDate() - numberOfDay);
            }
            i++;
            if (i === doctors.length) {
                return false;
            }
        }
        return dateOfMonday;
    }

    function dataChecking(week, lpu, id) {
        var bool = true;

        if ((typeof week !== "number") || (typeof lpu !== "string") || (!document.getElementById(id))) {
            bool = false;
        }

        return bool;
    }

    return {
        setWeek: function(week) {
            scheduleGo(week);
        },

        getWeek: function() {
            return currentWeek;
        },
        goToNextWeek: function() {
            scheduleGo(++currentWeek);
        },

        goToPreviousWeek: function () {
            if (currentWeek != 0) {
                scheduleGo(--currentWeek);
            } else {
                scheduleGo(0);
            }
        },

        scheduleGo: scheduleGo,

        clearSchedule: function(idInHtml) {
            var clearElement = (idInHtml !== undefined ) ? document.getElementById(idInHtml) : document.getElementById(currentIdInHtml);

            clearIfThereIsTable(clearElement);
        }
    }

}());
