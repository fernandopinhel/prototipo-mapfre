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

$('.process-model li.active::before, .process-model li.visited::before').click(function(){
  $(".process-model li.active:first-child::before").addClass("d-block");
});
// fim script for tab steps

// btn prev e next

// btn next
$(".primeira-etapa-btn > .btn-next").click(function(){
  $(".primeira-etapa-btn").addClass("d-none");
  $(".segunda-etapa-btn").removeClass("d-none");
});

$(".segunda-etapa-btn > .btn-next").click(function(){
  $(".segunda-etapa-btn").addClass("d-none");
  $(".terceira-etapa-btn").removeClass("d-none");
});

$(".terceira-etapa-btn > .btn-next").click(function(){
  $(".terceira-etapa-btn").addClass("d-none");
  $(".quarta-etapa-btn").removeClass("d-none");
});
// fim btn next

// btn prev
$(".segunda-etapa-btn > .btn-prev").click(function(){
  $(".segunda-etapa-btn").addClass("d-none");
  $(".primeira-etapa-btn").removeClass("d-none");
});

$(".terceira-etapa-btn > .btn-prev").click(function(){
  $(".terceira-etapa-btn").addClass("d-none");
  $(".segunda-etapa-btn").removeClass("d-none");
});

$(".quarta-etapa-btn > .btn-prev").click(function(){
  $(".quarta-etapa-btn").addClass("d-none");
  $(".terceira-etapa-btn").removeClass("d-none");
});
// fim btn prev

$("[l-1]").click(function(){
  $(".primeira-etapa-btn").removeClass("d-none");
  $(".primeira-etapa-btn").addClass("d-block");
  $(".segunda-etapa-btn").addClass("d-none");
  $(".segunda-etapa-btn").removeClass("d-block");
  $(".terceira-etapa-btn").addClass("d-none");
  $(".terceira-etapa-btn").removeClass("d-block");
  $(".quarta-etapa-btn").addClass("d-none");
  $(".quarta-etapa-btn").removeClass("d-block");
});

$("[l-2]").click(function(){
  $(".segunda-etapa-btn").removeClass("d-none");
  $(".segunda-etapa-btn").addClass("d-block");
  $(".primeira-etapa-btn").addClass("d-none");
  $(".primeira-etapa-btn").removeClass("d-block");
  $(".terceira-etapa-btn").addClass("d-none");
  $(".terceira-etapa-btn").removeClass("d-block");
  $(".quarta-etapa-btn").addClass("d-none");
  $(".quarta-etapa-btn").removeClass("d-block");
});

$("[l-3]").click(function(){
  $(".terceira-etapa-btn").removeClass("d-none");
  $(".terceira-etapa-btn").addClass("d-block");
  $(".primeira-etapa-btn").addClass("d-none");
  $(".primeira-etapa-btn").removeClass("d-block");
  $(".segunda-etapa-btn").addClass("d-none");
  $(".segunda-etapa-btn").removeClass("d-block");
  $(".quarta-etapa-btn").removeClass("d-block");
  $(".quarta-etapa-btn").addClass("d-none");
});

$("[l-4]").click(function(){
  $(".quarta-etapa-btn").removeClass("d-none");
  $(".quarta-etapa-btn").addClass("d-block");
  $(".primeira-etapa-btn").addClass("d-none");
  $(".primeira-etapa-btn").removeClass("d-block");
  $(".segunda-etapa-btn").addClass("d-none");
  $(".segunda-etapa-btn").removeClass("d-block");
  $(".terceira-etapa-btn").addClass("d-none");
  $(".terceira-etapa-btn").removeClass("d-block");
});
// fim botoes prev e next

// tabela botões animados

$('[sel-produto="1"]').click(function(){
  $('[sel-produto="1"]').addClass("d-none");
  $('[sel-produto="escolhido-1"]').removeClass("d-none");
  $('.table>tbody>tr').addClass('bg-sel');
});

$('[sel-produto="escolhido-1"]').click(function(){
  $('[sel-produto="1"]').removeClass("d-none");
  $('[sel-produto="escolhido-1"]').addClass("d-none");
});


$('[sel-produto="2"]').click(function(){
  $('[sel-produto="2"]').addClass("d-none");
  $('[sel-produto="escolhido-2"]').removeClass("d-none");
  $('.table>tbody>tr').addClass('bg-sel');
});

$('[sel-produto="escolhido-2"]').click(function(){
  $('[sel-produto="2"]').removeClass("d-none");
  $('[sel-produto="escolhido-2"]').addClass("d-none");
});


$('[sel-produto="3"]').click(function(){
  $('[sel-produto="3"]').addClass("d-none");
  $('[sel-produto="escolhido-3"]').removeClass("d-none");
  $('.table>tbody>tr').addClass('bg-sel');
});

$('[sel-produto="escolhido-3"]').click(function(){
  $('[sel-produto="3"]').removeClass("d-none");
  $('[sel-produto="escolhido-3"]').addClass("d-none");
});


$('[sel-produto="4"]').click(function(){
  $('[sel-produto="4"]').addClass("d-none");
  $('[sel-produto="escolhido-4"]').removeClass("d-none");
  $('.table>tbody>tr').addClass('bg-sel');
});

$('[sel-produto="escolhido-4"]').click(function(){
  $('[sel-produto="4"]').removeClass("d-none");
  $('[sel-produto="escolhido-4"]').addClass("d-none");
});

$('[sel-produto="5"]').click(function(){
  $('[sel-produto="5"]').addClass("d-none");
  $('[sel-produto="escolhido-5"]').removeClass("d-none");
  $('.table>tbody>tr').addClass('bg-sel');
});

$('[sel-produto="escolhido-5"]').click(function(){
  $('[sel-produto="5"]').removeClass("d-none");
  $('[sel-produto="escolhido-5"]').addClass("d-none");
});

$('.table>tbody>tr').click(function(){
  // Removendo a classe de todos os elementos da lista
  $('.table>tbody>tr').removeClass('bg-sel');
  // Adicionando classe ao elemento da lista clicada
  $(this).addClass('bg-sel');
});

$('.table>tbody>tr').click(function(){
  // Removendo a classe de todos os elementos da lista
  $('.table>tbody>tr').removeClass('bg-sel');
  // Adicionando classe ao elemento da lista clicada
  $(this).addClass('bg-sel');
});

// fim tabela botões animados

// select form

$(".custom-select").each(function() {
var classes = $(this).attr("class"),
id      = $(this).attr("id"),
name    = $(this).attr("name");
var template =  '<div class="' + classes + '">';
template += '<span class="custom-select-trigger">' + $(this).attr("placeholder") + '</span>';
template += '<div class="custom-options">';
$(this).find("option").each(function() {
template += '<span class="custom-option ' + $(this).attr("class") + '" data-value="' + $(this).attr("value") + '">' + $(this).html() + '</span>';
});
template += '</div></div>';

$(this).wrap('<div class="custom-select-wrapper"></div>');
$(this).hide();
$(this).after(template);
});
$(".custom-option:first-of-type").hover(function() {
$(this).parents(".custom-options").addClass("option-hover");
}, function() {
$(this).parents(".custom-options").removeClass("option-hover");
});
$(".custom-select-trigger").on("click", function() {
$('html').one('click',function() {
$(".custom-select").removeClass("opened");
});
$(this).parents(".custom-select").toggleClass("opened");
event.stopPropagation();
});
$(".custom-option").on("click", function() {
$(this).parents(".custom-select-wrapper").find("select").val($(this).data("value"));
$(this).parents(".custom-options").find(".custom-option").removeClass("selection");
$(this).addClass("selection");
$(this).parents(".custom-select").removeClass("opened");
$(this).parents(".custom-select").find(".custom-select-trigger").text($(this).text());
});

//fim select form
