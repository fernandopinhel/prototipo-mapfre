// script datepicker
$('.form_date').datetimepicker({
  language:  'pt-BR',
  autoclose: 1,
  minView: 2,
  format: "dd/mm/yyyy"
});
// fim script datepicker

// inputs
$('.box-info').click(function() {
  var evt = $(this);
  var e_type = $(evt).attr('');
  $('.box-info').val(e_type);
  $('.box-info').removeClass("box-focus");
  $(this).addClass("box-focus");
});


$('.box-info').on("keydown", function (e) {
  // use which ou charCode ou e.keyCode, dependendo do navegador
  var key = e.which || e.charCode || e.keyCode;
  // 9 é o caracter Unicode da tecla TAB
  if (key === 9) {
  if (e) {
    $('.box-info').removeClass("box-focus");
    $(this).addClass("box-focus");
  }
  return true;
  }
});

// $("input").focus(function() {
//   $(".box-info").addClass("box-focus");
// });
// fim inputs

// script for tab steps
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
  var href = $(e.target).attr('href');
  var curr = $(".process-model a[href='" + href + "']").parent();

  $('.process-model li').removeClass();
  curr.addClass("active");
  curr.prevAll().addClass("visited");
});

$('button.next').click(function(){
  $('.nav li.active').next('li').find('a').attr("data-toggle","tab").trigger("click");
});

$('button.prev').click(function() {
  $('.nav li.active').prev('li').find('a').attr("data-toggle","tab").trigger("click");
  $(".btn-final").addClass("d-none");
  $(".btn-next").removeClass("d-none");
});

$('a[href="#vistoria"]').click(function(){
	$(".btn-final").removeClass("d-none");
  $(".btn-next").addClass("d-none");
});

$('a[href="#dados-veiculos"]').click(function(){
	$(".btn-final").addClass("d-none");
  $(".btn-next").removeClass("d-none");
});

$('a[href="#dados-pessoais"]').click(function(){
  $(".btn-final").addClass("d-none");
  $(".btn-next").removeClass("d-none");
});
// fim script for tab steps
