
###############################################################
###############################################################
#  R script for stats and plots in LaiRaczRoberts 
#  Experiment 1
#  Author: Wei Lai (weilai.phonetics@gmail.com)
###############################################################
###############################################################

########## Roadmap ##########
# Part1: Info of subj, score, duration
   # Starting from Line 71
# Part2: Results of suffix and Alien ID (Fig.3-4)
   # Starting from Line 128
# Part3: LMER for Suffix and Alien ID (Table 2)
   # Starting from Line 202
# Part4: Results and correlations in task comparison (Fig. 5)
   # Starting from Line 245
# Part5: Generalization to new words (Fig. 6)
   # Starting from Line 312
# Part 6: Learning performance (Fig. 12): 
  # Starting from Line 384

# install or activate required packages:
library(reshape2)
library(Matrix)
library(lme4)
library(ggplot2)
library(gridExtra)
library(tidyverse)

#define function g_legend
g_legend<-function(a.gplot){
  tmp <- ggplot_gtable(ggplot_build(a.gplot))
  leg <- which(sapply(tmp$grobs, function(x) x$name) == "guide-box")
  legend <- tmp$grobs[[leg]]
  return(legend)}

# Change to the local directory where you put "LaiRaczRobertsData.csv"
data_dir <- "/Users/rebeccapizzitola/Documents/GitHub/ling-245b-project/replication/"

# import data
d<- read_csv('LaiRaczRobertsData.csv', 
             col_names = TRUE,
             col_types = NULL)

# remove participants whose duration is above 97.5% or below 2.5%
lower = quantile(d$`duration(m)`, c(.025, .975))[1]
upper = quantile(d$`duration(m)`, c(.025, .975))[2]

d = d %>% 
  mutate(
    outlier = ifelse(`duration(m)` < lower | `duration(m)` > upper, T, F)
  )
d2 = d %>% filter(!outlier)

# number of participants on each condition
d2 %>% 
  distinct(condition,UserID) %>%
  count(condition)

# start of analyses on Experiment 1
e1 = d2 %>% 
  filter(Experiment == 'One')

# participant information in Experiment 1
e1.subj = e1 %>%
  distinct(UserID, Score,gender,recruit,
         age,condition, `duration(m)`) 

#----------------------basic info------------------

# gender info: female: 51; male: 42
e1.subj %>% count(gender)

# age info: Min: 17, Max:73, Mean: 29
summary(as.numeric(e1.subj$age))

# recruit: Penn: 29; Prolific:64 
e1.subj %>% count(recruit)

# condition: exposure: 49, noexposure:44
e1.subj %>% count(condition)

# measure correlation between duration, Score, age
cor.test(e1.subj$`duration(m)`,e1.subj$age)
cor.test(e1.subj$Score,e1.subj$age)
cor.test(e1.subj$Score,e1.subj$`duration(m)`)

#Welch two-sample t-test on score by gender
a<-e1.subj[which(e1.subj$gender=="male"),"Score"]
b<-e1.subj[which(e1.subj$gender=="female"),"Score"]
t.test(unlist(a),unlist(b))

#Welch two-sample t-test on score by subject pool
a<-e1.subj[which(e1.subj$recruit=="Penn"),"Score"]
b<-e1.subj[which(e1.subj$recruit!="Penn"),"Score"]
t.test(unlist(a),unlist(b))

#Welch two-sample t-test on score by condition
a<-e1.subj[which(e1.subj$condition=="Exposure"),"Score"]
b<-e1.subj[which(e1.subj$condition!="Exposure"),"Score"]
t.test(unlist(a),unlist(b))

#Welch two-sample t-test on duration by condition
a<-e1.subj[which(e1.subj$gender=="male"),"duration(m)"]
b<-e1.subj[which(e1.subj$gender=="female"),"duration(m)"]
t.test(unlist(a),unlist(b))

#Welch two-sample t-test on duration by subject pool
a<-e1.subj[which(e1.subj$recruit=="Penn"),"duration(m)"]
b<-e1.subj[which(e1.subj$recruit!="Penn"),"duration(m)"]
t.test(unlist(a),unlist(b))

#Welch two-sample t-test on duration by condition
a<-e1.subj[which(e1.subj$condition=="Exposure"),"duration(m)"]
b<-e1.subj[which(e1.subj$condition!="Exposure"),"duration(m)"]
t.test(unlist(a),unlist(b))

# distribution of score and duration

# duration devide by 60 to covert to minutes   
mean(as.numeric(as.character(e1$'duration(m)')))/60
# 53.13566
sd(as.numeric(as.character(e1$'duration(m)')))/60
# 14.26763

#----------------------graph: Figure 3-4------------------

# divde data of experiment 1 to alien and suffix selection
ExpOneAlien<-e1[which(e1$task=="alien ID"),]
ExpOneSuff<-e1[which(e1$task!="alien ID"),]

# transfer the data of suffix selection 
# such that it shows for each participant:
# the condition of that participant, 
# how many dup and nup responses they chosed
# in response to different aliens.

ExpOneSuff.plot<-dcast(ExpOneSuff, 
                       UserID + condition + CriticalStimuli ~ Response)

# each participant has performed 38 suffx id in total,
# divided by 38 provides the ratio of responded dup and nup

ExpOneSuff.plot[,"nup"]<-ExpOneSuff.plot[,"nup"]/38
ExpOneSuff.plot[,"dup"]<-ExpOneSuff.plot[,"dup"]/38

# Fig 3: The mean and 95% CI of nup responses given by 
# participants on different conditions in response to different aliens

ggplot(ExpOneSuff.plot, aes(x=CriticalStimuli, y=nup, group=condition,fill=condition, color=condition))+
  stat_summary(fun.y=mean, geom="bar",position=position_dodge(0.9))+
  stat_summary(fun.data = mean_cl_normal, geom="errorbar",width=0.2, fun.args=(conf.int=0.95),
               color="black", position=position_dodge(0.9))+
  labs(x="Alien stimulus in suffix selection",
       y="Probability of a nup response")+
  ylim(0,1)+
  scale_color_manual(values=c("#999999","#999999"))+
  scale_fill_manual(values=c("#999999","white"))+
  theme_bw()+
  theme(legend.position = "bottom", legend.direction = "horizontal") 

ggsave(file="ExpOneSuffxIden.pdf", 
       width = 3, height = 3)

# transfer the data of alien selection 
# such that it shows for each participant:
# the condition of that participant, 
# how many Gulu and Norl responses they chosed
# in response to different suffixes

ExpOneAlien.plot<-dcast(ExpOneAlien, UserID + condition + CriticalStimuli ~ Response)

# each participant has performed 20 alien selection in total,
# divided by 20 provides the ratio of responded Norl and Gulu

ExpOneAlien.plot[,"Norl"]<-ExpOneAlien.plot[,"Norl"]/20
ExpOneAlien.plot[,"Gulu"]<-ExpOneAlien.plot[,"Gulu"]/20

# Fig 4: The mean and 95% CI of Norl responses given by 
# participants on different conditions in response to different suffixes

ggplot(ExpOneAlien.plot, aes(x=CriticalStimuli, y=Norl, 
                             group=interaction(CriticalStimuli,condition),
                             fill=condition, color=condition))+
  stat_summary(fun.y=mean, geom="bar",position=position_dodge(0.9))+
  stat_summary(fun.data=mean_cl_normal,fun.args=(conf.int=0.95),
               geom="errorbar",position=position_dodge(0.9),
               color="black",width=0.2)+
  ylim(0,1)+
  scale_color_manual(values=c("#999999","#999999"))+
  scale_fill_manual(values=c("#999999","white"))+
  labs(x="Suffix stimulus in alien selection",
       y="Probability of a Norl response")+
  theme_bw()+
  theme(legend.position = "bottom", legend.direction = "horizontal") 

ggsave(file="ExpOneAlienIden.pdf", 
       width = 3, height = 3)

#---------------Mixed-effects model for Experiment 1-------

# results in Table 2: suffix selection

# coding: Norl-0, Gulu-1; dup-0, nup-1
ExpOneSuff$CriticalStimuli<-relevel(as.factor(ExpOneSuff$CriticalStimuli),ref = "Norl")
ExpOneSuff$Response<-relevel(as.factor(ExpOneSuff$Response), ref = "dup")

# a logistic linear mixed effect model, with Suffix as DV, 
# Alien, Condition and their itneractions as IV,
# Word and Participant as random intercept

summary(glmer(Response~CriticalStimuli*condition+(1|Word)+(1|UserID),
                 family=binomial, data=ExpOneSuff))


#   results in Table 2: alien selection

# coding: Norl-1, Gulu-0; dup-0, nup-1
ExpOneAlien$CriticalStimuli<-relevel(as.factor(ExpOneAlien$CriticalStimuli),ref ="dup")
ExpOneAlien$Response<-relevel(as.factor(ExpOneAlien$Response), ref =  "Gulu")

# a logistic linear mixed effect model, with Alien as DV, 
# Suffix, Condition and their itneractions as IV,
# Word and Participant as random intercept

summary(glmer(Response~CriticalStimuli*condition+(1|Word)+(1|UserID),
              family=binomial, data=ExpOneAlien))


# Appendix A: Table 4-5

# Model for Suffix selection including novelty as a predictor
ExpOneSuff$novelty<-relevel(as.factor(ExpOneSuff$novelty), ref="old")
ExpOneSuff$CriticalStimuli<-relevel(as.factor(ExpOneSuff$CriticalStimuli), ref="Norl")
summary(glmer(Response~CriticalStimuli*condition*novelty+(1|Word)+(1|UserID),
              family=binomial, data=ExpOneSuff))

# Model for Alien selection including novelty as a predictor
ExpOneAlien$novelty<-relevel(as.factor(ExpOneAlien$novelty), ref="old")
summary(glmer(Response~CriticalStimuli*condition*novelty+(1|Word)+(1|UserID),
              family=binomial, data=ExpOneAlien))

#---------------- Comparison between tasks----------------

# In suffix selection, find out how frequent 
# "nup" is chosen for Norl by each participant
NupgivenNorl<-ExpOneSuff.plot[which(ExpOneSuff.plot$CriticalStimuli=="Norl"),
                c("UserID","condition","nup")]

# In alien selection, find out how frequent
# "dup" is chosen for "Gulu" by each participant
DupgivenGulu<-ExpOneSuff.plot[which(ExpOneSuff.plot$CriticalStimuli=="Gulu"),
                              c("UserID","condition","dup")]

# merge the above two data frame to look at the correlation between
# Nup given Norl and Dup given Gulu within individual participant

SuffTask<-merge(NupgivenNorl, DupgivenGulu,
                by=c("UserID", "condition"))

# plot dup given Gulu along the x axis, nup given nup along the y axis
# use different color to represent participants on different conditions

p1<-ggplot(SuffTask,aes(x=dup, y=nup))+
  xlab("dup response rate given Gulus")+
  ylab("nup response rate given Norls")+
  geom_jitter(aes(shape=condition),color="#999999",
              size=2,alpha=0.8) +
  geom_smooth(method="lm",fill="light blue")+
  scale_shape_manual(values=c(16,1)) +
  theme_bw()+theme(legend.position = "bottom")

cor.test(SuffTask[,"nup"],SuffTask[,"dup"])#0.4047383 


# In alien selection, find out how frequent 
# "Gulu" is chosen for dup by each participant,
# as well as how frequent "Norl" is chosen for nup,
# merge the two dataframe to look at their correlation at individual level

AlienTask<-merge(ExpOneAlien.plot[which(ExpOneAlien.plot$CriticalStimuli=="dup"),
                                  c("UserID", "condition","Gulu")], 
                 ExpOneAlien.plot[which(ExpOneAlien.plot$CriticalStimuli=="nup"),
                                  c("UserID", "condition","Norl")], 
                 by=c("UserID", "condition"))

# plot NorlgivenNup on the x-axis, GulugivenDup on the y-axis
# each point stands for a participant, and color stands for condition
p2<-ggplot(AlienTask,aes(x=Norl, y=Gulu))+
  xlab("Gulu response rate given dup")+
  ylab("Norl response rate given nup")+
  geom_jitter(aes(shape=condition),color="#999999",
              size=2,alpha=0.8) +
  geom_smooth(method="lm",fill="light blue")+
  scale_shape_manual(values=c(16,1)) +
  theme_bw()+theme(legend.position = "bottom")

cor.test(AlienTask[,"Gulu"],AlienTask[,"Norl"])
#0.9735952 
mylegend<-g_legend(p2)

ExpOneTask<- grid.arrange(arrangeGrob(grobs = list(p1+ theme(legend.position="none"),
                                                   p2 + theme(legend.position="none")),
                                      nrow=1),mylegend, nrow=2,heights=c(20, 6))


ggsave(ExpOneTask, file="ExpOneTask.pdf", 
       width = 6, height = 3.5)

#---------------- Generalization to new word----------------

#seperate data according to task again
ExpOneAlien<-e1[which(e1$task=="alien ID"),]
ExpOneSuff<-e1[which(e1$task!="alien ID"),]

# transfer the data of suffix selection, but
# this time, include the factor of novelty 
# such that it shows for each participant:
# how many Gulu and Norl responses they chosed
# in response to different suffixes with old and new words

ExpOneSuff.plot<-dcast(ExpOneSuff, UserID + condition + CriticalStimuli + novelty ~ Response)

# there are 5 new words and 14 old words, so the 38 trials should split into 10 and 28
ExpOneSuff.plot[which(ExpOneSuff.plot$novelty=="new"),"nup"]<-ExpOneSuff.plot[which(ExpOneSuff.plot$novelty=="new"),"nup"]/10
ExpOneSuff.plot[which(ExpOneSuff.plot$novelty=="new"),"dup"]<-ExpOneSuff.plot[which(ExpOneSuff.plot$novelty=="new"),"dup"]/10

ExpOneSuff.plot[which(ExpOneSuff.plot$novelty!="new"),"nup"]<-ExpOneSuff.plot[which(ExpOneSuff.plot$novelty!="new"),"nup"]/28
ExpOneSuff.plot[which(ExpOneSuff.plot$novelty!="new"),"dup"]<-ExpOneSuff.plot[which(ExpOneSuff.plot$novelty!="new"),"dup"]/28

ExpOneSuff.plot$novelty<-gsub("new","unseen",ExpOneSuff.plot$novelty)
ExpOneSuff.plot$novelty<-gsub("old","seen",ExpOneSuff.plot$novelty)

ExpOneSuff.Gen<-
ggplot(ExpOneSuff.plot,aes(x=CriticalStimuli, y=nup, group=condition,fill=condition, color=condition))+
  facet_grid(~novelty)+
  stat_summary(fun.y=mean,  geom="bar",position=position_dodge(0.9))+
  stat_summary(fun.data = mean_cl_normal, geom="errorbar",width=0.2, fun.args=(conf.int=0.95),
               color="black", position=position_dodge(0.9))+
  ylim(0,1)+
  scale_color_manual(values=c("#999999","#999999"))+
  scale_fill_manual(values=c("#999999","white"))+
  labs(x="Alien stimulus in suffix selection",
       y="Probability of a nup response")+
  theme_bw()+
  theme(legend.position = "bottom", legend.direction = "horizontal") 

# do the same for the data of alien selection, include novelty
# data of alien selection actually contains 10 trials for both old words and new words,
# so no need to divide by different numbers
ExpOneAlien.plot<-dcast(ExpOneAlien, UserID + condition +CriticalStimuli + novelty ~ Response)
ExpOneAlien.plot$Norl<-ExpOneAlien.plot$Norl/10

ExpOneAlien.plot$novelty<-gsub("new","unseen",ExpOneAlien.plot$novelty)
ExpOneAlien.plot$novelty<-gsub("old","seen",ExpOneAlien.plot$novelty)

ExpOneAlien.Gen<-
  ggplot(ExpOneAlien.plot,
         aes(x=CriticalStimuli, y=Norl, group=condition,color=condition,fill=condition))+
  facet_grid(~novelty)+
  stat_summary(fun.y=mean, geom="bar",position=position_dodge(0.9))+
  stat_summary(fun.data = mean_cl_normal, geom="errorbar",width=0.2,  fun.args=(conf.int=0.95),
               color="black", position=position_dodge(0.9))+
  ylim(0,1)+
  scale_color_manual(values=c("#999999","#999999"))+
  scale_fill_manual(values=c("#999999","white"))+
  labs(x="Suffix stimulus in alien selection",
       y="Probability of a Norl response")+
  theme_bw()+
  theme(legend.position = "bottom", legend.direction = "horizontal") 

mylegend<-g_legend(ExpOneSuff.Gen)

ExpOneGen <- grid.arrange(arrangeGrob(ExpOneSuff.Gen + theme(legend.position="none"),
                                       ExpOneAlien.Gen + theme(legend.position="none"),
                                       nrow=1),
                           mylegend, nrow=2,heights=c(20, 6))

ggsave(ExpOneGen, file="ExpOneGeneralization.pdf", 
       width = 7, height = 3)

# -----------Appendix: learning performance (Fig. 12)-----------------

#using median score as a criterion of learning performance
median<-median(as.numeric(as.character(e1$Score)))

#participants whose score is above or equal to median are labeled "good"
e1[which(as.numeric(as.character(e1$Score))>median),"performance"]<-"good"
e1[which(as.numeric(as.character(e1$Score))==median),"performance"]<-"good"
e1[which(as.numeric(as.character(e1$Score))<median),"performance"]<-"poor"

# transfer the data of suffix selection, but
# this time, include the factor of performance
# such that it shows for each participant: their condition and performance,
# and how many Gulu and Norl responses they chosed in response to different suffixes
ExpOneSuff.plot<-dcast(e1, UserID + condition + CriticalStimuli + performance ~ Response)
ExpOneSuff.plot[,"nup"]<-ExpOneSuff.plot[,"nup"]/38

# Fig 12 left: The mean and 95% CI of nup responses in response to different aliens
# given by participants of different performances on different conditions 

ExpOneSuff.performance<-
  ggplot(subset(ExpOneSuff.plot, CriticalStimuli %in% c("Norl","Gulu")),
         aes(x=CriticalStimuli, y=nup, group=condition,fill=condition, color=condition))+
  facet_grid(~performance)+
  stat_summary(fun.y=mean, geom="bar",position=position_dodge(0.9))+
  stat_summary(fun.data = mean_cl_normal, fun.args=(conf.int=0.95),geom="errorbar",width=0.2, 
               color="black", position=position_dodge(0.9))+
  labs(x="Alien stimulus in suffix selection",
       y="Probability of a nup response")+
  ylim(0,1)+
  scale_color_manual(values=c("#999999","#999999"))+
  scale_fill_manual(values=c("#999999","white"))+
  theme_bw()+
  theme(legend.position = "bottom", legend.direction = "horizontal") 

ExpOneAlien.plot<-dcast(e1, UserID + condition + CriticalStimuli +performance ~ Response)
ExpOneAlien.plot<-subset(ExpOneAlien.plot, !is.na(CriticalStimuli))
ExpOneAlien.plot[,"Norl"]<-ExpOneAlien.plot[,"Norl"]/20

# Fig 12 right: The mean and 95% CI of Norl responses in response to different suffixes
# given by participants of different performances on different conditions 

ExpOneAlien.performance<-
  ggplot(subset(ExpOneAlien.plot, CriticalStimuli %in% c("nup","dup")),
         aes(x=CriticalStimuli, y=Norl, 
             group=condition,fill=condition, color=condition))+
  facet_grid(~performance,scales="free")+
  stat_summary(fun.y=mean, geom="bar",position=position_dodge(0.9))+
  stat_summary(fun.data = mean_cl_normal, geom="errorbar",width=0.2, 
               fun.args=(conf.int=0.95),
               color="black", position=position_dodge(0.9))+
  labs(x="Suffix stimulus in alien selection",
       y="Probability of a Norl response")+
  ylim(0,1)+
  scale_color_manual(values=c("#999999","#999999"))+
  scale_fill_manual(values=c("#999999","white")) +
  theme_bw()+
  theme(legend.position = "bottom", legend.direction = "horizontal") 

mylegend<-g_legend(ExpOneAlien.performance)

ExpOneGood <- grid.arrange(arrangeGrob(ExpOneSuff.performance + theme(legend.position="none"),
                                       ExpOneAlien.performance + theme(legend.position="none"),
                                       nrow=1),
                           mylegend, nrow=2,heights=c(20, 6))

ggsave(ExpOneGood, file="ExpOnePerformance.pdf", 
       width = 7, height = 3)

#----------end----------