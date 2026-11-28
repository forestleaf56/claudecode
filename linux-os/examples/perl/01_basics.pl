#!/usr/bin/perl
use strict;
use warnings;

# Perl basics: arrays, hashes and regular expressions
my @langs = ("Perl", "Python", "Ruby", "PHP");
foreach my $lang (@langs) {
    print "I like $lang\n";
}

my %year = (Perl => 1987, Python => 1991, Ruby => 1995, PHP => 1995);
for my $l (sort { $year{$a} <=> $year{$b} } keys %year) {
    print "$l appeared in $year{$l}\n";
}

my $text = "Contact: ada\@example.com, grace\@example.org";
my @emails = $text =~ /(\w+)\@[\w.]+/g;
print "Users found: @emails\n";
