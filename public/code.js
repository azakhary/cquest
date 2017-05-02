var load_level;
$(function() {
    load_level = function(code) {
      var query = "/api/level";
      $("#warning-span").hide();
      $("#code_input").val("");
      if(code == "") {
          $("#code-group").addClass("has-error");
          return;
      }
      if(code != null) {
        code = encodeURIComponent(code)
        query+="/"+code;
      }
      $.get( query, function( data ) {
        if(data.status == "auth") {
          window.location = "/";
          return;
        }
        if(data.status == "nok") {
          if(data.hint != null) {
            $("#warning-span").html(data.hint);
            $("#warning-span").show();
          }
          $("#code-group").addClass("has-error");
        } else {
          $("#code-group").removeClass("has-error");
          $("#level-num").html(data.level);
          $("#player-name").html(data.username);
          $("#question-box").html(data.question);
          $('#question-box script').each(function (index, element) { eval(element.innerHTML); });
          $("#code-main").show();
        }
      });
    }

    $("#code_input").keypress(function (e) {
      if (e.which == 13) {
        load_level($("#code_input").val().toLowerCase());
      }
    });


    $("#execute_btn").click(function() {
      load_level($("#code_input").val().toLowerCase());
    });

    $("#code-main").hide();
    load_level();
});


utils = {};

utils.allShaders = {};
utils.SHADER_TYPE_FRAGMENT = "x-shader/x-fragment";
utils.SHADER_TYPE_VERTEX = "x-shader/x-vertex";

utils.addShaderProg = function (gl, vertex, fragment) {

    utils.loadShader(vertex, utils.SHADER_TYPE_VERTEX);
    utils.loadShader(fragment, utils.SHADER_TYPE_FRAGMENT);

    var vertexShader = utils.getShader(gl, vertex);
    var fragmentShader = utils.getShader(gl, fragment);

    var prog = gl.createProgram();
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {alert("Could not initialise main shaders");}

    return prog;
};

utils.loadShader = function(file, type) {
    var cache, shader;

    $.ajax({
        async: false, // need to wait... todo: deferred?
        url: "shaders/" + file, //todo: use global config for shaders folder?
        success: function(result) {
           cache = {script: result, type: type};
        }
    });

    // store in global cache
    uilts.allShaders[file] = cache;
};
