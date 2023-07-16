odoo.define('equino_trading.form_handler', function (require) {
    "use strict";

    var Class = require('web.Class');
    var rpc = require('web.rpc');
    var time = require('web.time');

    var Shipping = Class.extend({
        init: function () {
            
            const is_shipping_form = $('.form-shipping-page').length;
            if ( is_shipping_form > 0 )
            {
                const params = (new URL(window.location.href)).searchParams;       

                this.id = null;
                this.shipper = null;

                try
                {
                    if(parseInt(params.get('session')))
                    {
                        this.id = params.get('session');
                    }
                }
                catch(error)
                {}

                try
                {
                    if(parseInt(params.get('shipper')))
                    {
                        this.shipper = params.get('shipper');
                    }
                }
                catch(error)
                {}
                
                this.departure = null;
                this.arrive = null;
                this.entry_date_time = null;

                this.relase_date_time = null;
                this.stimate_date_shipping = null;

                this.items = [];

                this.set_form_values($('tr.form-item').first());
            }            

        },
        set_form_values: function (new_row)
        {

            this.init_created_form();
            this.fill_shipper();
            this.fill_departure();
            this.fill_arrive();
            this.set_entry_date_time();
            this.set_form_item(new_row);
            this.fill_form()

        },
        init_created_form: function () {
            if (this.id != null)
            {
                $('input[name=id]').val(this.id);
                $('#shipper').val();
            }
        },
        fill_form: function () {
            const self = this;
            if (this.id != null)
            {
                var data = { "params": {'form_id':this.id} };
                $.ajax({
                    type: "POST",
                    url: '/form/fill_form',
                    data: JSON.stringify(data),
                    dataType: 'json',
                    contentType: "application/json",
                    async: false,
                    success: function(form) 
                    {
                        console.log(form);
                        form = form.result; 
                        if (form.from_departure_id)
                        {
                            $('#departure').val(form.from_departure_id);
                        }
                        if (form.to_arrive_id)
                        {
                            $('#arrive').val(form.to_arrive_id);
                        }
                        if (form.entry_date)
                        {
                            $('#entry_date_time').val(form.entry_date);
                        }
                        if (form.entry_time)
                        {
                            $('#entry_time').val(form.entry_time);
                        }
                        if (form.release_date)
                        {
                            $('#relase_date_time').val(form.release_date);
                        }
                        if (form.items)
                        {
                            (form.items).forEach(function(item, index)
                            {
                                var selector = null;
                                if(index==0)
                                { 
                                    selector = $('tr.form-item').first();
                                }
                                else
                                {    
                                    self.add_form_item();       
                                    selector = $('tr.form-item').last();                        
                                    self.set_form_item(selector);
                                    
                                }
                                
                                item = item[0];
                                if (item.name)
                                    selector.find('input[name=resgistered_name]').val(item.name);
                                if (item.gender)
                                    selector.find('select[name=gender]').val(item.gender[0]);
                                if (item.specie_id)
                                    selector.find('select[name=specie]').val(item.specie_id[0]);
                                if (item.breed_id)
                                    selector.find('select[name=breed]').val(item.breed_id[0]);
                                if (item.age)
                                    selector.find('input[name=age]').val(item.age);
                                if (item.color_id)
                                    selector.find('select[name=color]').val(item.color_id[0]);
                                if (item.id_number_microchip)
                                    selector.find('input[name=microchip_id]').val(item.id_number_microchip);
                                if (item.final_customer)
                                    selector.find('input[name=final_customer]').val(item.final_customer);
                                if (item.t_number)
                                    selector.find('input[name=t_number]').val(item.t_number);
                                if (item.driver_id)
                                    selector.find('input[name=driver_contact]').val(item.driver_id);                                
                                
                            });
                        } 
                        
                        if (form.crf_crm_lead_id)
                            $('.form-form-shipping').after('<p><small>' + String(form.crf_crm_lead_id) + '</small></p>');

                    }
                });
            }
        },

        set_entry_date_time: function () {

            var datepickers_options = {
                format: 'YYYY-DD-MM'
            };

            $('.o_website_form_date').datepicker(datepickers_options);

        },
        save_shpping_form: function () {
            this.get_form_values();
            var data = { "params": {'values':this} };
            const self = this;
            $.ajax({
                        type: "POST",
                        url: '/form/save',
                        data: JSON.stringify(data),
                        dataType: 'json',
                        contentType: "application/json",
                        async: false,
                        success: function(response) 
                        {}
                    });
        },
        get_form_values: function () {

            var self = this;
            this.id = $("input[name='id']").val();
            this.shipper = $('#shipper').val();
            this.departure = $('#departure').val();
            this.arrive = $('#arrive').val();
            this.entry_date_time = $('#entry_date_time').val();
            this.relase_date_time = $('#relase_date_time').val();
            this.stimate_date_shipping = $('#stimate_date_shipping').val();
            var items = [];

            $('tr.form-item').each(function () {

                var resgistered_name = $(this).find('td').find('input#resgistered_name').val();
                var gender = $(this).find('td').find('select#gender').val();
                var specie = $(this).find('td').find('select#specie').val();
                var breed = $(this).find('td').find('select#breed').val();
                var age = $(this).find('td').find('input#age').val();
                var microchip_id = $(this).find('td').find('input#microchip_id').val();
                var color = $(this).find('td').find('select#color').val();
                var final_customer = $(this).find('td').find('input#final_customer').val();
                var t_number = $(this).find('td').find('input#t_number').val();
                var driver_contact = $(this).find('td').find('input#driver_contact').val();

                var item = {
                    'resgistered_name': resgistered_name,
                    'gender': gender,
                    'specie': specie,
                    'breed': breed,
                    'age': age,
                    'microchip_id': microchip_id,
                    'color': color,
                    'final_customer': final_customer,
                    't_number': t_number,
                    'driver_contact': driver_contact,
                };
                
                items.push(item);
                

            });

            this.items = items;

        },
        add_form_item: function () {

            var new_row = $('tr.form-item').first().clone();
            new_row.find('input').val('');
            new_row.find('select').find('option').remove();
            $('tbody.form-items').last().append(new_row);
            this.set_form_item(new_row);
            $('tr.form-item').last().attr('class', String('form-item form-item-') + String(parseInt($('tr.form-item').length)));
            $('tr.form-item').first().attr('class', 'form-item form-item-1');
        },
        remove_form_item: function (selector) {

            if (selector.closest('tr').hasClass('form-item-1')) {
                var unique_row = $('tr.form-item').first();
                unique_row.find('input').val('');
                unique_row.find('select').find('option').remove();
                this.set_form_values(unique_row);
            }
            else {
                selector.closest('tr').remove();
            }

        },
        fill_shipper: function () {
            var select = $('select#shipper');
            var data = { "params": {} };
            const self = this;
            $.ajax({
                        type: "POST",
                        url: '/form/shippers',
                        data: JSON.stringify(data),
                        dataType: 'json',
                        contentType: "application/json",
                        async: false,
                        success: function(shippers) 
                        {
                            shippers = shippers.result;   
                            if(shippers)
                                    {   
                                        
                                        try
                                        {
                                            shippers.forEach(shipper => {
                                                var option = $('<option/>');
                                                option.html(shipper.name);
                                                option.attr('id', shipper.id);
                                                option.attr('value', shipper.id);
                                                select.append(option);
                                            });
                                        }
                                        catch(error)
                                        {console.log(error)}                                        

                                        if (self.shipper != null)
                                        {
                                            $('select#shipper').val(self.shipper);
                                        }
                                    }                                       
                        }
                    });

        },
        fill_departure: function () {

            var data = { "params": {} };
            $.ajax({
                        type: "POST",
                        url: '/form/flyes',
                        data: JSON.stringify(data),
                        dataType: 'json',
                        contentType: "application/json",
                        async: false,
                        success: function(fly_codes) 
                        {
                            fly_codes = fly_codes.result;
                            var select = $('select#departure');
                            if(fly_codes)
                            {
                                try
                                {
                                    fly_codes.forEach(fly_code => {
                                        var option = $('<option/>');
                                        option.html(fly_code.name);
                                        option.attr('id', fly_code.id);
                                        option.attr('value', fly_code.id);
                                        option.attr('code', fly_code.code);
                                        select.append(option);
                                    });
                                }
                                catch(error)
                                {}
                                
                            }                                      
                        }
                    });

        },
        fill_arrive: function () {

            var data = { "params": {} };
            $.ajax({
                        type: "POST",
                        url: '/form/flyes',
                        data: JSON.stringify(data),
                        dataType: 'json',
                        contentType: "application/json",
                        async: false,
                        success: function(fly_codes) 
                        {
                            fly_codes = fly_codes.result;
                            var select = $('select#arrive');
                            if(fly_codes)
                            {
                                try
                                {
                                    fly_codes.forEach(fly_code => {
                                        var option = $('<option/>');
                                        option.html(fly_code.name);
                                        option.attr('id', fly_code.id);
                                        option.attr('value', fly_code.id);
                                        option.attr('code', fly_code.code);
                                        select.append(option);
                                    });
                                }
                                catch(error)
                                {}
                            }                                    
                        }
                    });

        },
        set_form_item: function (new_row) {
            try
            {
                var data = { "params": {} };
                $.ajax({
                            type: "POST",
                            url: '/form/get_item_data',
                            data: JSON.stringify(data),
                            dataType: 'json',
                            contentType: "application/json",
                            async: false,
                            success: function(response) 
                            {

                                response = response.result;
                                const line = new_row;
                
                                const line_delete = line.find('td').find('div.form-item-action-remove');
                                line_delete.click(function () {
                                    shippingForm.remove_form_item($(this));
                                });
                
                                const selector_genders = line.find('td').find('select#gender');
                                var option = $('<option/>');
                                selector_genders.append(option);
                                
                                const selector_species = line.find('td').find('select#specie');
                                var option = $('<option/>');
                                selector_species.append(option);

                                const selector_colors = line.find('td').find('select#color');
                                var option = $('<option/>');
                                selector_colors.append(option);

                                const selector_breeds = line.find('td').find('select#breed');
                                var option = $('<option/>');
                                selector_colors.append(option);

                                const selector_microchips = line.find('td').find('input#microchip_id');   

                
                                if (response.genders)
                                {
            
                                    try
                                    {
                                        response.genders.forEach(gender => {
                                            var option = $('<option/>');
                                            option.html(gender.name);
                                            option.attr('id', gender.id);
                                            option.attr('value',  gender.id);
                                            selector_genders.append(option);
                                        });
                                    }
                                    catch(error)
                                    {}  
                                }
                                
                                if (response.genders)
                                {
                                    try
                                    {
                                        response.specie_ids.forEach(specie_id => {
                                            var option = $('<option/>');
                                            option.html(specie_id.name);
                                            option.attr('id', specie_id.id);
                                            option.attr('value', specie_id.id);
                                            selector_species.append(option);
                                        });
                                    }
                                    catch(error)
                                    {}  
                                }
                                
                                if (response.genders)
                                {
                                    try
                                    {
                                        response.breed_ids.forEach(breed_id => {
                                            var option = $('<option/>');
                                            option.html(breed_id.name);
                                            option.attr('id', breed_id.id);
                                            option.attr('value', breed_id.id);
                                            selector_breeds.append(option);
                                        });
                                    }
                                    catch(error)
                                    {}  
                                }
                
                                if (response.genders)
                                {
                                    try
                                    {
                                        response.id_type_ids.forEach(id_type_id => {
                                            var option = $('<option/>');
                                            option.html(id_type_id.name);
                                            option.attr('id', id_type_id.id);
                                            option.attr('value', id_type_id.id);
                                            selector_id_type.append(option);
                                        });
                                    }
                                    catch(error)
                                    {}
                                }
                
                                if (response.color_ids)
                                {
                                    try
                                    {
                                        response.color_ids.forEach(color_id => {
                                            var option = $('<option/>');
                                            option.html(color_id.name);
                                            option.attr('id', color_id.id);
                                            option.attr('value', color_id.id);
                                            selector_colors.append(option);
                                        });
                                    }
                                    catch(error)
                                    {}
                                }           
                                                            
                            }
                        });

            }
            catch(error)
            {
                console.log('***************');
                console.log(error);
            }      
        },

    });

    var shippingForm = new Shipping();

    var interval = setInterval(function () {

        if (('.form-add-item').length > 0) {

            $('div.form-add-item').click(function (event) {
                event.preventDefault();
                shippingForm.add_form_item();
            });

            $('div.form-item-action-remove').click(function () {
                shippingForm.remove_form_item($(this));
            });

            $('button#form-form-shipping-submit').click(function (event) {
                event.preventDefault();
                shippingForm.save_shpping_form();
            });            

            clearInterval(interval);

        }

    });


});