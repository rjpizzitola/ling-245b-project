# =============================================================================
# Power Analysis for Replication of Experiment 1
# Lai, Rácz & Roberts (2020), Cognitive Science 44, e12832
#
# Goal: find the minimum N needed to achieve 80%, 90%, and 95% power
# to detect the interaction effect reported in Table 2, for both tasks.
#
# Approach: simulation-based power analysis via simr.
# Fixed effects taken directly from Table 2.
# Random effects SDs swept over {0.3, 0.5, 0.8} since the paper does
# not report them — the conservative (largest) estimate drives the
# sample size recommendation.
#
# Critical interaction terms:
#   Suffix selection:  alienGulu:conditionNoExposure   beta = -0.51
#   Alien selection:   suffixnup:conditionNoExposure   beta =  1.05
#
# Collaboration note: Claude code helped me a LOT with this because I had never used R before, missed the class about this and this was a complicated procedure to write up.
# =============================================================================

# --- 0. Packages --------------------------------------------------------------
# Uncomment to install:
# install.packages(c("simr", "lme4", "ggplot2"))

library(simr)
library(lme4)
library(ggplot2)

set.seed(42)

# --- 1. Settings --------------------------------------------------------------

# N values to evaluate
n_breaks <- c(20, 40, 60, 80, 100, 120, 150, 180, 210, 250)

# RE SDs to sweep (paper does not report random effects)
re_sds <- c(0.3, 0.5, 0.8)

# Power thresholds to report
thresholds <- c(0.80, 0.90, 0.95)

# nsim: 100 for a quick check, 1000 for final reportable estimates.
nsim <- 100

# --- 2. Fixed effects from Table 2 -------------------------------------------

fe_suffix <- c(
  "(Intercept)"                   = -0.20,
  "alienGulu"                     = -0.62,
  "conditionNoExposure"           =  0.58,
  "alienGulu:conditionNoExposure" = -0.51
)

fe_alien <- c(
  "(Intercept)"                   = -0.04,
  "suffixnup"                     =  0.14,
  "conditionNoExposure"           = -0.56,
  "suffixnup:conditionNoExposure" =  1.05
)

# --- 3. Skeleton data builders ------------------------------------------------
# Suffix-selection: 14 words x 2 species x 2 reps = 56 trials per participant
# Alien-selection:  14 words x 2 suffixes = 28 trials per participant

build_suffix_data <- function(n_participants, n_words = 14) {
  dat <- expand.grid(
    participant = factor(1:n_participants),
    word        = factor(1:n_words),
    alien       = factor(c("Norl", "Gulu")),
    rep         = 1:2
  )
  dat$condition <- factor(
    ifelse(as.integer(dat$participant) <= n_participants / 2,
           "Exposure", "NoExposure")
  )
  dat$alien     <- relevel(dat$alien,     ref = "Norl")
  dat$condition <- relevel(dat$condition, ref = "Exposure")
  dat
}

build_alien_data <- function(n_participants, n_words = 14) {
  dat <- expand.grid(
    participant = factor(1:n_participants),
    word        = factor(1:n_words),
    suffix      = factor(c("dup", "nup"))
  )
  dat$condition <- factor(
    ifelse(as.integer(dat$participant) <= n_participants / 2,
           "Exposure", "NoExposure")
  )
  dat$suffix    <- relevel(dat$suffix,    ref = "dup")
  dat$condition <- relevel(dat$condition, ref = "Exposure")
  dat
}

# --- 4. Model builder ---------------------------------------------------------

build_model <- function(dat, formula, fixed_effects, re_sd) {
  variance <- re_sd^2
  re_list  <- list(
    participant = matrix(variance,
                         dimnames = list("(Intercept)", "(Intercept)")),
    word        = matrix(variance,
                         dimnames = list("(Intercept)", "(Intercept)"))
  )
  makeGlmer(
    formula = formula,
    fixef   = fixed_effects,
    VarCorr = re_list,
    data    = dat,
    family  = binomial
  )
}

# --- 5. Interpolation helper --------------------------------------------------

min_n_for_power <- function(ns, powers, threshold) {
  if (max(powers, na.rm = TRUE) < threshold) return(NA_integer_)
  idx <- which(powers >= threshold)[1]
  if (idx == 1) return(ns[1])
  n0 <- ns[idx - 1]; p0 <- powers[idx - 1]
  n1 <- ns[idx];     p1 <- powers[idx]
  as.integer(ceiling(n0 + (threshold - p0) / (p1 - p0) * (n1 - n0)))
}

# --- 6. Main sweep ------------------------------------------------------------

run_sweep <- function(task, fixed_effects, interaction_term) {

  cat("\n", strrep("=", 62), "\n", sep = "")
  cat(sprintf(" Task: %s\n Interaction: %s\n", task, interaction_term))
  cat(strrep("=", 62), "\n\n")

  all_rows   <- list()
  min_n_rows <- list()

  for (sd_val in re_sds) {

    cat(sprintf("  RE SD = %.1f\n", sd_val))

    max_n <- max(n_breaks)
    if (task == "suffix") {
      dat     <- build_suffix_data(max_n)
      formula <- y ~ alien * condition + (1 | participant) + (1 | word)
    } else {
      dat     <- build_alien_data(max_n)
      formula <- y ~ suffix * condition + (1 | participant) + (1 | word)
    }
    dat$y <- rbinom(nrow(dat), 1, 0.5)

    m <- tryCatch(
      build_model(dat, formula, fixed_effects, sd_val),
      error = function(e) {
        cat("    Model build failed:", conditionMessage(e), "\n"); NULL
      }
    )
    if (is.null(m)) next

    cat("    Fixed effects:\n")
    print(round(fixef(m), 3))

    m_ext <- extend(m, along = "participant", n = max_n)
    cat(sprintf("    Extended to N = %d\n",
                length(unique(getData(m_ext)$participant))))

    pc <- tryCatch(
      powerCurve(
        m_ext,
        test     = fixed(interaction_term),
        along    = "participant",
        breaks   = n_breaks,
        nsim     = nsim,
        progress = FALSE
      ),
      error = function(e) {
        cat("    powerCurve failed:", conditionMessage(e), "\n"); NULL
      }
    )
    if (is.null(pc)) next

    # Parse summary robustly across simr versions
    pc_raw <- summary(pc)
    if (!"n" %in% names(pc_raw)) {
      n_col <- names(pc_raw)[
        sapply(pc_raw, function(x) all(x %in% n_breaks) && length(unique(x)) > 1)
      ][1]
      if (!is.na(n_col)) names(pc_raw)[names(pc_raw) == n_col] <- "n"
    }
    needed <- c("n", "mean", "lower", "upper")
    if (!all(needed %in% names(pc_raw))) {
      cat("    Could not parse summary. Columns:",
          paste(names(pc_raw), collapse = ", "), "\n")
      next
    }

    pc_df       <- pc_raw[, needed]
    pc_df$re_sd <- sd_val
    pc_df$task  <- task
    all_rows[[length(all_rows) + 1]] <- pc_df

    cat(sprintf("    Power estimates:\n"))
    print(pc_df[, needed], row.names = FALSE)
    cat("\n")

    # Minimum N for each threshold
    for (thr in thresholds) {
      mn <- min_n_for_power(pc_df$n, pc_df$mean, thr)
      min_n_rows[[length(min_n_rows) + 1]] <- data.frame(
        task      = task,
        re_sd     = sd_val,
        threshold = thr,
        min_n     = mn
      )
    }

    # Save progress after each SD
    saveRDS(do.call(rbind, all_rows),
            sprintf("results_%s_partial.rds", task))
  }

  list(
    curve  = do.call(rbind, all_rows),
    min_ns = do.call(rbind, min_n_rows)
  )
}

# --- 7. Run -------------------------------------------------------------------

res_suffix <- run_sweep("suffix", fe_suffix, "alienGulu:conditionNoExposure")
saveRDS(res_suffix, "results_suffix.rds")

res_alien  <- run_sweep("alien",  fe_alien,  "suffixnup:conditionNoExposure")
saveRDS(res_alien,  "results_alien.rds")

# --- 8. Minimum-N summary table -----------------------------------------------

# NULL-safe combine: a task produces NULL if all RE SD models failed
safe_rbind <- function(...) {
  parts <- Filter(Negate(is.null), list(...))
  if (length(parts) == 0) return(NULL)
  do.call(rbind, parts)
}

min_n_all <- safe_rbind(res_suffix$min_ns, res_alien$min_ns)
if (is.null(min_n_all)) stop("No results to report -- all models failed.")
min_n_all$threshold_label <- paste0(min_n_all$threshold * 100, "%")

cat("\n", strrep("=", 62), "\n", sep = "")
cat(" Minimum N to achieve each power level\n")
cat(" (linearly interpolated from simulated power curve)\n")
cat(strrep("=", 62), "\n\n")

wide <- reshape(
  min_n_all[, c("task", "re_sd", "threshold_label", "min_n")],
  idvar     = c("task", "re_sd"),
  timevar   = "threshold_label",
  direction = "wide"
)
names(wide) <- gsub("min_n\\.", "N for ", names(wide))
print(wide, row.names = FALSE)

cat("\nNote: NA = power did not reach that threshold within N =",
    max(n_breaks), "-- increase n_breaks ceiling.\n")

cat("Done. Set nsim = 1000 for publication-quality estimates.\n")