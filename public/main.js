$(function() {

    var signUp = function() {
      var data = {username: $("#play-username").val(), password: $("#play-password").val()};
      $.post( "/signup", data, function( data ) {
        if(data.status == "ok") {
          goToGame();
        } else if(data.status == "duplicate") {
            $("#error-text").html("This username is already in use, please choose another or switch to continue tab.");
            $("#error-box").fadeIn();
        }
      });
    }

    var signIn = function() {
      var data = {username: $("#load-username").val(), password: $("#load-password").val()};
      $.post( "/continue", data, function( data ) {
        if(data.status == "ok") {
          goToGame();
        } else if(data.status == "wrong") {
            $("#error-text").html("This username and password do not match");
            $("#error-box").fadeIn();
        }
      });
    }

    var loadLeaderboard = function() {
      $.get( "/leaderboard", function( data ) {
        $("#leaderboard-data").html("");
        var cnt = "";
        if(data != null && data.arr.length > 0) {
          for(key in data.arr) {
            var dt = data.arr[key];
            var d = new Date(dt.last_action * 1000);
            var diff = new Date((dt.last_action - dt.reg_time) * 1000);
            var dv = [
               d.getFullYear(),
               d.getMonth()+1,
               d.getDate(),
               d.getHours(),
               d.getMinutes(),
               d.getSeconds(),
            ];
            var dfH = (diff.getHours()-4)+"";
            var dfM = diff.getMinutes()+"";
            var dfS = diff.getSeconds()+"";
            if(dfH.length == 1) dfH = "0"+dfH;
            if(dfM.length == 1) dfM = "0"+dfM;
            if(dfS.length == 1) dfS = "0"+dfS;

            dt.date = dv[2]+"."+dv[1]+"."+dv[0]+" "+dv[3]+":"+dv[4];
            dt.time = dfH +":"+dfM+":"+dfS;
            var elem = "<div class='row table-data'>" +
                         "<div class='col-md-4 title'>"+dt.username+"</div>" +
                         "<div class='col-md-4 title'>"+dt.time+"</div>" +
                         "<div class='col-md-4 title'>"+dt.date+"</div>" +
                       "</div>";
            cnt += elem;
          }
          $("#leaderboard-data").html(cnt);
          $(".results").show();

          $("#num_trying").html(data.cnt);
        }
      });
    }

    loadLeaderboard();

    var goToGame = function() {
      location.href='/code';
    }

    $("#start-tab").click(function() {
        $("#error-box").fadeOut();
    });
    $("#continue-tab").click(function() {
        $("#error-box").fadeOut();
    });

    $("#play-button").click(signUp);
    $("#load-button").click(signIn);


    $('#play-password').keypress(function (e) {
      if (e.which == 13) {
        signUp();
        return false;
      }
    });
    $('#play-username').keypress(function (e) {
      $("#error-box").fadeOut();
      if (e.which == 13) {
        $("#play-password").focus();
        return false;
      }
    });

    $('#load-password').keypress(function (e) {
      if (e.which == 13) {
        signIn();
        return false;
      }
    });
    $('#load-username').keypress(function (e) {
      $("#error-box").fadeOut();
      if (e.which == 13) {
        $("#load-password").focus();
        return false;
      }
    });
});
