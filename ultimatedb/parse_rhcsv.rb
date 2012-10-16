# encoding: UTF-8

# Parse relics_history.csv file into ultimate.db

require 'rubygems'
require 'data_mapper'
require 'sqlite3'
require 'dm-sqlite-adapter'
require 'csv'

DataMapper.setup(:default, 'sqlite:./ultimate.db')

class Monuments
  include DataMapper::Resource
  storage_names[:default] = 'monuments'
  
  property :id, Integer, :key => true
  property :nid_id, Integer
  property :parent_id, Integer
  property :child_order, Integer
  property :identification, Text
  property :categories, Text
  property :existance, Text
  property :state, Text
  property :register_numer, Text
  property :dating_of_obj, Text
  property :street, Text
  property :place_id, Text
  property :commune_id, Text
  property :district_id, Text
  property :voivodeship_id, Text
  property :latitude, Float
  property :longitude, Float
  property :coordinates_approval, Boolean
end

class Terc
  include DataMapper::Resource
  storage_names[:default] = 'terc'
  
  property :terc_code, Text, :key => true, :unique => true, :required => true
  property :name, Text
end

DataMapper.finalize
DataMapper.auto_upgrade!

puts "Start parsing"

# line[0]: "export_id"
# line[1]: "suggested_at"
# line[2]: "relic_id"
# line[3]: "nid_id"
# line[4]: "nid_kind"
# line[5]: "relic_ancestry"
# line[6]: "register_number"
# line[7]: "voivodeship"
# line[8]: "district"
# line[9]: "commune"
# line[10]: "place"
# line[11]: "place_id"
# line[12]: "place_id_action"
# line[13]: "identification"
# line[14]: "identification_action"
# line[15]: "street"
# line[16]: "street_action"
# line[17]: "dating"
# line[18]: "dating_action"
# line[19]: "latitude"
# line[20]: "longitude"
# line[21]: "coordinates_action"
# line[22]: "categories"
# line[23]: "categories_action"

CSV.foreach("../scripts/relics_history.csv") do |line|
  
  if line[0] != "export_id" && Monuments.first(:id => line[2]) == nil
    puts "#{line[0]}:#{line[2]}"
    if Monuments.create(:id => line[2], 
                     :nid_id => line[3], 
                     :parent_id => line[5], 
                     :identification => line[13], 
                     :existance => "existed", 
                     :state => "unchecked", 
                     :register_numer => line[6], 
                     :dating_of_obj => line[17], 
                     :street => line[15],
                     :place_id => line[11],
                     :commune_id => Terc.all(:name => line[9]).select{|e| e.terc_code.length == 7}.first.terc_code,
                     :district_id => Terc.all(:name => line[8]).select{|e| e.terc_code.length == 4}.first.terc_code,
                     :voivodeship_id => Terc.all(:name => line[7].upcase.tr('ąćęłńóśźż', 'ĄĆĘŁŃÓŚŹŻ')).select{|e| e.terc_code.length == 2}.first.terc_code,
                     :latitude => line[19],
                     :longitude => line[20],
                     :coordinates_approval => false)
      puts "Zabytek #{id} utworzony"
    else
      puts "Problem z utworzeniem zabytku #{id}: #{Monuments.errors.to_s}!"
    end
  elsif line[21] == "edit" || line[21] == "confirm"
    @m = Monuments.first(:id => line[2])
    @m.update(:coordinates_approval => true)
  end
end

puts "Parsing finished"