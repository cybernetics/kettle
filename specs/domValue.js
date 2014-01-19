describe("DomValue: ", function() {
  var vmember,$div,$checkbox,$input,$select,$textarea, $img, $radio,
    v = 'foo', img = "http://www.site.com/img";

  beforeEach(function() {
    $div = $('<div></div>');
    $checkbox = $('<input type="checkbox"/>');
    $input = $('<input type="text"/>');
    $select = $('<select><option value="foo">bar</option><option value="2">2</option></select>');
    $textarea = $('<textarea></textarea>');
    $img = $('<img src=""/>');
    $radio = '<input type="radio" name="radio"/>';
  });

  var createMember = function($el) {
      vmember =  new Kettle.DomValue({ el : $el[0]});
  }

  it("sets the value on a plain DOM element", function() {
    createMember($div);
    vmember.val(v);
    expect(vmember.val()).toBe(v);
    expect($div.text()).toBe(v);
  });

  it("gets the value on a plain DOM element", function() {
    createMember($div);
    $div.html(v);
    expect(vmember.val()).toBe(v);
  });

  it("sets the value on a input text element", function() {
    createMember($input);
    vmember.val(v);
    expect(vmember.val()).toBe(v);
    expect($input.val()).toBe(v);
  });

  it("gets the value on a input text element", function() {
    createMember($input);
    $input.val(v);
    expect(vmember.val()).toBe(v);
  });

  it("sets the value on a textarea element", function() {
    createMember($textarea);
    vmember.val(v);
    expect(vmember.val()).toBe(v);
    expect($textarea.val()).toBe(v);
  });

  it("gets the value on a textarea element", function() {
    createMember($textarea);
    $textarea.val(v);
    expect(vmember.val()).toBe(v);
  });

  it("sets the value on a select element", function() {
    createMember($select);
    vmember.val(v);
    expect(vmember.val()).toBe(v);
    expect($select.val()).toBe(v);
  });

  it("gets the value on a select element", function() {
    createMember($select);
    $select.val(v);
    expect(vmember.val()).toBe(v);
  });

  it("sets the value on a checkbox element", function() {
    createMember($checkbox);
    vmember.val(true);
    expect($checkbox.prop("checked")).toBe(true);
  });

  it("gets the value on a checkbox element", function() {
    createMember($checkbox);
    $checkbox.prop("checked", true);
    expect(vmember.val()).toBe(true);
  });

  it("sets the value on a radio element", function() {
    createMember($checkbox);
    vmember.val(true);
    expect($checkbox.prop("checked")).toBe(true);
  });

  it("gets the value on a radio element", function() {
      createMember($checkbox);
      $checkbox.prop("checked", true);
      expect(vmember.val()).toBe(true);
  });

  it("sets the value on a image element", function() {
    createMember($img);
    vmember.val(img);
    expect(vmember.val()).toBe(img);
    expect($img.attr('src')).toBe(img);
  });

  it("gets the value on a image element", function() {
    createMember($img);
    $img.attr('src',img);
    expect(vmember.val()).toBe(img);
  });
});
