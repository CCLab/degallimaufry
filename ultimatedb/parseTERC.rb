# encoding: UTF-8

require 'rubygems'
require 'data_mapper'
require 'sqlite3'
require 'dm-sqlite-adapter'
require 'rexml/document'

DataMapper.setup(:default, 'sqlite:./ultimate.db')

class Terc
  include DataMapper::Resource
  storage_names[:default] = 'terc'
  
  property :terc_code, Text, :key => true, :unique => true, :required => true
  property :name, Text
end

DataMapper.finalize
DataMapper.auto_upgrade!

file = File.new( "TERC.xml" )
doc = REXML::Document.new file

doc.elements.each("teryt/catalog/row") do |element|
  @terc_code = "#{element.elements["col[@name='WOJ']"].text}#{element.elements["col[@name='POW']"].text}#{element.elements["col[@name='GMI']"].text}#{element.elements["col[@name='RODZ']"].text}"
  @name = "#{element.elements["col[@name='NAZWA']"].text}"
  puts "#{@terc_code} #{@name}"
  Terc.create(:terc_code => @terc_code, :name => @name)
end

