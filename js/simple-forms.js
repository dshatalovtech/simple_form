/*
    var s = new SimpleForms("form_class_name");

    <form class="form_class_name"></form>


    I am using class instead id, as there is large chance you will use same logic for multityple forms

    --- Form bootstrap  (standard recommended layout)

    <form class="form_class_name">
        <div class="form_group">
            <label for=""></label>  or <div class="label"> will be same
            <input type="text" class="form_control" data-label="Field name"/>    -  user data-label="" if you want to set field's normal name in error reporting. AS <label> actually an contain anything but simple name
        </div>


        <input type="submit" value="" class="form_btn__submit"/>
    </form>

*/


function SimpleForms(formClassName)
{
    this.construct = function()
    {
        console.log("construct", formClassName);

        this.set("form_class_name",     formClassName);
        this.set("form_button__submit", "form_button__submit");
        this.set("form-actions", "form-actions");   
        this.set("form-messages", "form-messages");

        this.set("alerts_html__start_processing", '<div class="form-message form-message--processing">Saving</div>');


        this.set("alerts_html__error_required_fields", 'Several required fields are not set, please check form and submit again');
        this.set("alerts_html__error_required_field", 'Field {s1} is not set, please fill in and submit form again');
        this.set("alerts_html", '<div class="form-message form-message--error">{s1}</div>');

        this.set("alerts_html__success_text", 'Data was successfully submited');
        this.set("alerts_html__success", '<div class="form-message form-message--success">{s1}</div>');
        this.set("submit_url", "");
    }


    this.forms = [];


    this.waiting_data = function()
    {
        for (var i  = 0; i < this.forms.length; i++)
        {
            console.log("waiting_data", this.forms[i].form);
            this.add_class_name(this.forms[i].form, "waiting_data");
        }
    }

    this.set_default_data = function(default_data, prepared)
    {   

        if (prepared !== true)
        {
            var d_data = {};

            for (var i = 0; i< default_data.length; i++)
            {
                d_data[default_data[i].name]  = default_data[i].val;
            }
        }
        else 
            var d_data = default_data


        for (var i  = 0; i < this.forms.length; i++)
        {
            this.remove_class_name(this.forms[i].form, "waiting_data");
            this.forms[i].set_default_data(d_data);
        }
    }

    this.start = function()
    {
        var self = this;

        var arr = document.getElementsByClassName( this.get("form_class_name") );

        for (var i = 0; i < arr.length; i++)
        {

            var f       = new this.Form();
                f.form   = arr[i];
                f.that  = this;

            this.forms.push(f);
            this.forms[i].init();
        }
    }



    this.Form = function()
    {   
        this.submit_buttons  = [];
        this.values          = {};
        this.inputs          = [];
        this.form_messages   = [];
        this.form_actions    = [];
        this.required_errors = [];

        this.init = function()
        {
            /* Do not search in DOM each other, cache it */
            this.find_submit_buttons();
            this.find_form_elements();

            this.listen_clicks();
            this.listen_submit();
        }

        this.submit = function()
        {
            
            this.get_all_values();
            if (this.handle_errors_before_submit() === true)
            {
                this.alerts__start_processing();
                this.do_submit_request();
            }

        }

        this.handle_errors_before_submit = function()
        {
            if (this.required_errors.length == 0)
                return true;

            if (this.required_errors.length > 1)
            {
                var html        = this.that.get("alerts_html");
                var message_str = this.that.get("alerts_html__error_required_fields");

                var html = html.split("{s1}");
                html = html[0] + message_str + html[1];

                this.alerts__error(html);
            }
            else 
            {
                var html        = this.that.get("alerts_html");

                var message_str = this.that.get("alerts_html__error_required_field");
                    message_str = message_str.split("{s1}");

                    var field_name = this.required_errors[0].namel

                    if (this.required_errors[0].getAttribute("data-label"))
                        field_name = this.required_errors[0].getAttribute("data-label");

                    message_str  = message_str[0] + " " + field_name +  " " + message_str; 

                    var html = html.split("{s1}");
                    html = html[0] + message_str + html[1];

                    this.alerts__error(html);
            }

            return false;
        }

        this.make_form_data_string = function()
        {
            var form_data = {};

            for (var i in this.values)
            {
                form_data[i] = encodeURIComponent(this.values[i]);
            }

            return JSON.stringify(form_data);
        }

        this.do_submit_request = function()
        {
            var self = this;

            var postUrl = this.that.get("submit_url")
           

            // Set up an asynchronous AJAX POST request
            var xhr = new XMLHttpRequest();
            xhr.open('POST', postUrl, true);
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            
            xhr.onreadystatechange = function() { 

                if (this.readyState == 4)
                {
                    self.alerts__remove();
                }  

                if (this.readyState == 4 && this.status == 200) 
                {
                    self.alerts__success();
                 //  var responseText =  JSON.parse(this.responseText);
                    
                } 
                else
                if (this.readyState == 4)
                {
                    self.submit_error_response(this.responseText);
                    self.on_submit_error_response(this.responseText);
                }      
     
            };  

            var form_data = this.make_form_data_string();

            var params = 'submit-form=' + this.that.get("form_class_name");
                params += '&form_data=' + form_data;

            xhr.send(params);             
        }

        this.on_submit_error_response = function()
        {
            // Must be rewrite from user
        }

        this.submit_error_response = function(responseText)
        {       
            this.alerts__error__serverside(responseText);
        }

        this.get_all_values = function()
        {
            this.get_all_inputs();
        }

        this.find_submit_buttons = function()
        {
            this.submit_buttons = [];

            var btn = this.form.getElementsByClassName( this.that.get("form_button__submit") );
            
            this.submit_buttons.push({
                btn : btn
            });
        }


        this.find_form_elements = function()
        {
            this.form_actions = document.getElementsByClassName(this.that.get("form-actions"));
            this.form_messages = document.getElementsByClassName(this.that.get("form-messages"));
        }

        this.listen_submit = function()
        {            
            var self = this;

            this.form.addEventListener("submit", function(event){               
               if (event.target.className == self.that.get("form_class_name"))
               {
                    event.preventDefault()
                    self.submit();
                    return true;
               }
            });  
        }



        this.listen_clicks = function()
        {
            var self = this;

            for (var i = 0; i < this.submit_buttons.length; i++)
            {
                for (var j = 0; j <  this.submit_buttons[i].btn.length; j++)
                {
                    this.submit_buttons[i].btn[j].addEventListener("click", function(event){
                       if (event.target.className == self.that.get("form_button__submit"))
                       {
                            event.preventDefault()
                            self.submit();
                            return true;
                       }
                    });
                }
            }          
        }



        this.get_all_inputs = function()
        {
            this.find_inputs();

            this.required_errors = [];

            for (var i = 0; i < this.inputs.length; i ++)
            {
                if (this.inputs[i].type != 'submit' && this.inputs[i].type != 'button')
                this.values[this.inputs[i].name] = this.inputs[i].value;

                if (this.inputs[i].className.indexOf("form-control--required") !== -1 && this.inputs[i].value == "")
                {
                    this.required_errors.push({
                        "name" : this.inputs[i].name,
                        "obj"  : this.inputs[i],
                    });

                    this.that.add_class_name(this.inputs[i], "form-control--error");
                }
                else 
                {
                    this.that.remove_class_name(this.inputs[i], "form-control--error");
                }
            }
            
            console.log("this.vlaues", this.values);
        }

        this.find_inputs = function() 
        {   
            if (this.inputs.length == 0)
                this.inputs = this.form.getElementsByTagName('input');
        }

        this.set_default_data = function(default_data)
        {
            this.find_inputs();

            console.log("set_default_data", default_data);
            for (var i = 0; i < this.inputs.length; i ++)
            {
                var name = this.inputs[i].name;
                if(default_data[name])
                    this.inputs[i].value = default_data[name];
            }  
        }

        this.alerts__remove = function()
        {
            
            for (var i = 0; i < this.form_messages.length; i++)
            {
                this.that.remove_class_name(this.form_messages[i], "form-messages--active");
                this.form_messages[i].innerHTML = '';  
            }

        
            for (var i = 0; i < this.form_actions.length; i++)
            {
                this.that.remove_class_name(this.form_actions[i],"hidden hidden--processing");
            }
        }


        this.alerts__error = function(error_html_string)
        {
            var self = this;
            
            for (var i = 0; i < this.form_messages.length; i++)
            {
                this.that.add_class_name(this.form_messages[i], "form-messages--active");
                this.form_messages[i].innerHTML = error_html_string;  
            }
        }


        this.alerts__error__serverside = function(responseText)
        {
            var responseText =  JSON.parse(responseText);

            var self = this;

            var html        = this.that.get("alerts_html");
            var message_str = responseText.msg;

            var html = html.split("{s1}");
            html = html[0] + message_str + html[1];

            for (var i = 0; i < this.form_messages.length; i++)
            {
                this.that.add_class_name(this.form_messages[i], "form-messages--active");
                this.form_messages[i].innerHTML = html;  
            }
        }


        this.alerts__success = function()
        {
            var self = this;
            
            var text =  this.that.get("alerts_html__success_text");
            var html =  this.that.get("alerts_html__success");

                html = html.split("{s1}");
                html = html[0] + " " + text + " " + html[1];


            for (var i = 0; i < this.form_messages.length; i++)
            {
                this.that.add_class_name(this.form_messages[i], "form-messages--active");
                this.form_messages[i].innerHTML = html; 
            }  
        }

        this.alerts__start_processing = function()
        {
            var self = this;
        
            for (var i = 0; i < this.form_actions.length; i++)
                self.that.add_class_name(this.form_actions[i],"hidden hidden--processing");


            var html = this.that.get("alerts_html__start_processing");

            for (var i = 0; i < this.form_messages.length; i++)
            {
                this.that.add_class_name(this.form_messages[i], "form-messages--active");
                this.form_messages[i].innerHTML = html;
            }
        }

        
    }
    

    this.add_class_name = function(el, className)    
    {
        console.log("add_class_name", el);
        this.remove_class_name(el, className);
        el.className = el.className + " " + className;
    }

    this.remove_class_name = function(el, className)    
    {
        console.log("remove_class_name");
        console.log(el, className);
        if (typeof el == 'undefined')
            return false;

        el.className = el.className.replace(className, "");
    }

    this.args = [];
    
    this.set = function(k, v)
    {
        this.args[k] = v;
    }
    
    this.get = function(k)
    {
        if (typeof this.args[k] == "undefined")
        {
            return false;
        }
    
        return this.args[k]
    } 

    this.construct();   
        
}


/* Documentation


    -- Init 

    var bb = new SimpleForms();
    bb.init("form_id");
        
    bb.set_custom_data('user_id', 1);
    -- HTML 

    block-register__form__step   __step prefix for target required to make "required" works

    

    .submit-btn  - submit button listener


    -- Form object

    <form id="form_id">

    </form>


function SimpleForms()
{
    this.index = 0;
    this.clicked = false;
    this.args = {};
    this.custom_data = {};
    this.do_stop  = false;

    this.set_custom_data = function(k, v)
    {
        this.custom_data[k] = v;
    }

    this.get_custom_data = function()
    {
        return this.custom_data;
    }

    this.init = function(target)
    {
        var self = this;

        this.set("target", target);
        this.set("target__step", target + "__step");

       //$("#" + this.get("target") + " select").select2({ minimumResultsForSearch: -1});

        this.before_init();

            
        var target_action = $("#" + target).attr("action");

        if (target_action != '') 
            {
                
                this.set("url", target_action);
            }

        $("#" + target + " .submit-btn").click(function()
        {   
            self.step_change("next");
        });


        $("#" + target + " .prev-btn").click(function()
        {
            self.step_change("prev");
        });         

        console.log("Init", "."  + this.get("target__step") );
        $("."  + this.get("target__step") ).hide();
        $("."  + this.get("target__step") ).eq(this.index).show().addClass("open"); 


        self.display_current_step();
        

        var t_step = $("."  + self.get("target__step") ).length;

        if (t_step == false)
        {
            t_step = 1;
        }

        this.set("t_step", t_step);

        $("." + this.get("target") + "__t-step").html(this.get("t_step"));



        $("#" + this.get("target") + " input.required").keyup(function()
        {
            console.log("JEY");
            $(this).removeClass("required-error");
        });

        this.after_init();  


        
        $("#" + this.get("target")).submit(function(e)
        {
            console.log('self.form_errors', self.form_errors());
            if (self.form_errors() == true)
            {
                return false;
            }

            e.preventDefault();

            if (self.sbm_t)
            {
                clearTimeout(self.sbm_t);
                self.sbm_t = false;
            }

            self.sbm_tm = setTimeout(function()
            {
                self.submit_form();
                self.sbm_t = false;
            }, 100);
            

            return false;
        });
        


    }


    this.step_change = function(direction)
    {
        var self = this;


        if (this.form_errors() == true)
        {
            return false;
        }



        if (this.is_btn_clicked() == true )
        {
            return false;
        }

        
        $("." + this.get("target__step") ).eq(this.index).removeClass("open");


        var old_index = self.index;

        if (direction == "next")
        {            
            self.index++;
        }
        else 
        {
            self.index --;
        }


        console.log(self.index +" == "+ this.get("t_step"));
        if (self.index == this.get("t_step"))
        {

            $("#" + self.get("target")).submit();
            return false;
        }

         setTimeout(function()
         {
            $("."  + self.get("target__step") ).eq((old_index)).hide();
            $("."  + self.get("target__step") ).eq(self.index).show().addClass("open");
         },1000);


        


         self.display_current_step();  
    }
    
    this.beforeSubmit = function() 
    {

    }


    this.success = function(r)
    {
        
    }

    this.busy = 0;
    this.submit_form = function()
    {
        var self = this;

        if (self.busy == 1)
        {
            return false;
        }

        this.beforeSubmit();
        this.do_stop = false;
    
        self.old_submit_val = $("#" + this.get("target") + " .submit-btn").val();
        $("#" + this.get("target") + " .submit-btn").val("processing");
        $("#" + this.get("target") + " .submit-btn").addClass("processing");


        var inputs      = $("#" + this.get("target") + " input[type=text]");
        var hiddne_inputs      = $("#" + this.get("target") + " input[type=hidden]");
        var textarea      = $("#" + this.get("target") + " textarea");
        var emails      = $("#" + this.get("target") + " input[type=email]");
        var pass        = $("#" + this.get("target") + " input[type=password]");
        var checkboxes  = $("#" + this.get("target") + " input[type=checkbox]:checked");
        var radios       = $("#" + this.get("target") + " input[type=radio]:checked");
        var select      = $("#" + this.get("target") + " select");

        
        var data = {};
        console.log("inputsinputs", inputs);
        $.each(inputs, function()
        {
            var val = $(this).val();
            var name = $(this).attr("name");

            data[name] = encodeURIComponent(val);
            //data[name] = val;
        });

        $.each(hiddne_inputs, function()
        {
            var val = $(this).val();
            var name = $(this).attr("name");

            data[name] = encodeURIComponent(val);
            //data[name] = val;
        });

        
        $.each(textarea, function()
        {
            var val = $(this).val();
            var name = $(this).attr("name");

            data[name] = encodeURIComponent(val);
            //data[name] = val;
        });        

        $.each(emails, function()
        {
            var val = $(this).val();
            var name = $(this).attr("name");

            data[name] = encodeURIComponent(val);
            //data[name] = val;
        });


        $.each(pass, function()
        {
            var val = $(this).val();
            var name = $(this).attr("name");

            data[name] = encodeURIComponent(val);
           // data[name] = val;
        });

  
        $.each(select, function()
        {
            var val = $(this).val();
            var name = $(this).attr("name");

            data[name] = encodeURIComponent(val);
            //data[name] = val;
        });        
  

        $.each(checkboxes, function()
        {
            var name = $(this).attr("name");

            //data[name] = encodeURIComponent(val);
            data[name] = true;
        });      


        $.each(radios, function()
        {
            var name = $(this).attr("name");

            //data[name] = encodeURIComponent(val);
            data[name] =   $(this).val();
        });     

        var custom_data = this.get_custom_data();
        for (var i in custom_data)
        {
            data[i] = custom_data[i];
        }  

        if (!this.get("custom_action"))
        {
            data.action = this.get("target");
        }
        else 
        {
            data.action = this.get("custom_action");
        }

        self.onSubmit(data);

        if (this.do_stop == true)
        {
            return false;
        }

        if (!this.get("url"))
        {
            var url = location.href;

        }
        else 
        {
            var url = this.get("url");
        }


        self.busy = 1;
        $.ajax({
                 type : "POST",
                 url : url,
                 data : data,
                 dataType: "json",
                 success: function(response) {

                       console.log("response", response);
                       if (response && response.status == "error" || response.status == "400")
                       {
                            self.error(response);
                       }
                       else 
                       {
                            self.success(response);

                            setTimeout(function() 
                            {
                                self.open_success();
                            }, 1000);
                        }

                        setTimeout(function() 
                        {   self.busy = 0;

                             self.index = 0;
                            console.log("#" + self.get("target") + " .submit-btn");
                            $("#" + self.get("target") + " .submit-btn").val(self.old_submit_val);
                            $("#" + self.get("target") + " .submit-btn").removeClass("processing"); 
                        }, 1000);
                       
                    },
                 error: function(response) {

                       console.log("response", response);
                       if (response.status == "error" || response.status == "400")
                       {
                            self.error(response);
                       }
                       

                        setTimeout(function() 
                        {   self.busy = 0;
                            self.index = 0;
                            console.log("#" + self.get("target") + " .submit-btn");
                            $("#" + self.get("target") + " .submit-btn").val(self.old_submit_val);
                            $("#" + self.get("target") + " .submit-btn").removeClass("processing"); 
                        }, 1000);
                       
                    },                    
                complete: function()
                {
                        setTimeout(function() 
                        {   self.busy = 0;
                   
                        }, 1000);
                }
            });   
        console.log("data", data);


        
    }

    this.onSubmit = function(data)
    {

    }

    this.stop = function()
    {
        this.do_stop = true;
    }

    this.open_success = function()
    {
        
        $("."+  this.get("target") + "__success" ).show().addClass("open"); 
    }


    this.form_errors = function(required)
    {
        var self = this;

        if (!required)
            var required = $("."  + self.get("target__step") ).eq((this.index)).find("input.required");

        if (required.length == 0)
        {
            return false;
        }
        else 
        {
            var errors = 0;
            $.each(required, function()
            {
                var val = $(this).val();

                if (val == "" || !val)
                {
                    errors++;
                    $(this).addClass("required-error");
                }
                else 
                {
                    $(this).removeClass("required-error");
                }



            });


            if (errors == 0)
            {
                return false;
            }
            else 
            {
                return true;
            }
        }
    }


    this.is_btn_clicked = function()
    {   
        var self = this;

        if (self.clicked == true)
        {
            return true;
        }

        self.clicked = true;

        setTimeout(function() 
        {
            self.clicked = false;
        }, 1100);

        return false;

    }


    this.set = function(k, v)
    {
        console.log(k +" == ", v);
        this.args[k] = v;
    }


    this.get = function(k)
    {
        console.log("get", this);
        if (!this.args[k])
        {
            return false;
        }

        return this.args[k];
    }



    this.before_init = function()
    {

    }


    this.after_init = function()
    {

    }


    this.display_current_step = function()
    {
        $("." + this.get("target") + "__c-step").html(this.index+1);
    }    
}

*/